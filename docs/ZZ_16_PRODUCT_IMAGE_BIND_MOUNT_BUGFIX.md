# ZZ_16 — Bug ảnh sản phẩm không hiển thị trên Production (Bind Mount vs Named Volume)

> **TL;DR**: Ảnh sản phẩm không hiển thị trên site production **không phải lỗi code, không phải
> lỗi upload ảnh**. Nguyên nhân gốc là **VPS đang chạy bản `docker-compose.prod.yaml` CŨ** (dùng
> _named volume_) trong khi commit mới đã đổi sang _bind mount_ (`./upload:/app/upload`). File compose
> mới **không bao giờ tới được đĩa VPS** vì CI chỉ `scp` thư mục `scripts/*.sh`, còn `deploy.sh` cũ
> thì **không git-sync** file compose. Hậu quả: ảnh ta đẩy lên host `./upload/product/` nằm ở một nơi,
> còn container lại đọc ảnh từ named volume ở một nơi khác → container không "nhìn thấy" ảnh.

---

## Mục lục

1. [Bối cảnh — hệ thống serve ảnh thế nào](#1-bối-cảnh)
2. [Triệu chứng quan sát được](#2-triệu-chứng)
3. [Nguồn gốc vấn đề (root cause)](#3-nguồn-gốc-vấn-đề)
4. [Vì sao ta KẾT LUẬN được đây chính là nguyên nhân](#4-cách-chẩn-đoán)
5. [Hướng fix](#5-hướng-fix)
   - 5.1 Fix tức thời trên VPS
   - 5.2 Fix vĩnh viễn trong `deploy.sh` (Option B)
6. [Quy trình đưa ảnh lên VPS đúng chuẩn (mới)](#6-quy-trình-đưa-ảnh-lên-vps)
7. [Checklist phòng ngừa tái diễn](#7-checklist-phòng-ngừa)

---

## 1. Bối cảnh

### 1.1 API serve ảnh tĩnh như thế nào

File `apps/shopee-api/src/index.ts` cấu hình Express phục vụ ảnh tĩnh:

```ts
// dirNameWithEnv = path.dirname(__dirname)
//   - Dev:  __dirname = apps/shopee-api/src      → dirname = apps/shopee-api
//   - Prod: __dirname = /app/build (tsc flatten)  → dirname = /app   ← nơi mount ./upload
const dirNameWithEnv = path.dirname(__dirname)

app.use(
  `/${ROUTE_IMAGE}`,
  express.static(path.join(dirNameWithEnv, FOLDER_UPLOAD, FOLDERS.PRODUCT), staticCacheOptions),
)
app.use(
  `/${ROUTE_IMAGE}`,
  express.static(path.join(dirNameWithEnv, FOLDER_UPLOAD), staticCacheOptions),
)
```

Các hằng số (trong `apps/shopee-api/src/constants/config.ts`):

| Hằng số           | Giá trị          | Ý nghĩa                                           |
| ----------------- | ---------------- | ------------------------------------------------- |
| `ROUTE_IMAGE`     | `images`         | Route URL công khai → `https://domain/images/...` |
| `FOLDER_UPLOAD`   | `env.UPLOAD_DIR` | Thư mục gốc chứa file upload (vd: `upload`)       |
| `FOLDERS.PRODUCT` | `product`        | Thư mục con chứa ảnh sản phẩm                     |

→ Trong container production, đường dẫn vật lý mà API đọc ảnh là:
**`/app/upload/product/<tên-ảnh>`** (và fallback `/app/upload/<tên-ảnh>`).

### 1.2 Ảnh được đưa lên VPS bằng tay, KHÔNG qua git

`.gitignore` (dòng 54-56) loại trừ thư mục ảnh khỏi git:

```gitignore
# API uploaded images (transported to VPS manually, not via git)
apps/shopee-api/upload/
apps/shopee-api/src/upload/
```

→ Ảnh **không nằm trong repo**. Ta phải tự `scp`/`rsync` ảnh lên VPS. Đây là lý do việc _mount_
thư mục host vào container phải chính xác — nếu mount sai chỗ thì ảnh đẩy lên cũng vô nghĩa.

### 1.3 Container đọc `/app/upload` từ đâu? → phụ thuộc vào compose file

Đây là mấu chốt của toàn bộ bug. Thư mục `/app/upload` **bên trong** container được docker map ra
một vị trí **bên ngoài** (trên host). Cách map đó do `docker-compose.prod.yaml` quyết định. Và chính
chỗ này đã bị đổi từ **named volume → bind mount**, nhưng bản đổi đó chưa từng tới được VPS.

```
┌──────────────────────────── CONTAINER (shopee-api) ────────────────────────────┐
│  Express đọc ảnh ở: /app/upload/product/<file>                                   │
│                          │                                                       │
│                          ▼  (docker map theo "volumes:" trong compose file)      │
└──────────────────────────┼───────────────────────────────────────────────────-─┘
                           │
        ┌──────────────────┴───────────────────────┐
        ▼ (compose CŨ — named volume)               ▼ (compose MỚI — bind mount)
  /var/lib/docker/volumes/<vol>/_data         /home/prod/shopee-project/upload
  (KHÔNG ai đẩy ảnh vào đây)                  (đây là nơi ta scp/rsync ảnh lên ✓)
```

---

## 2. Triệu chứng

- Trên site production, **ảnh sản phẩm không hiển thị** (vỡ ảnh / 404).
- Trong khi đó:
  - Code serve ảnh **không đổi** và chạy đúng ở local/dev.
  - Ảnh **đã được đẩy lên VPS** đúng thư mục `~/shopee-project/upload/product/`.
  - Các API khác (không liên quan ảnh tĩnh) vẫn hoạt động bình thường.
- → Mâu thuẫn: "ảnh có trên đĩa VPS" nhưng "container trả 404". Đây là dấu hiệu kinh điển của việc
  **mount sai chỗ** chứ không phải lỗi code hay thiếu ảnh.

---

## 3. Nguồn gốc vấn đề

Vấn đề là tổ hợp của **3 mảnh ghép**, mỗi mảnh riêng lẻ đều "có vẻ đúng", nhưng ghép lại tạo ra lỗ hổng.

### Mảnh 1 — Commit đổi compose từ named volume → bind mount

Trong `docker-compose.prod.yaml`, service `shopee-api` được đổi cách mount thư mục upload:

```yaml
shopee-api:
  image: ${REGISTRY:-myuser}/shopee-api:${IMAGE_TAG:-latest}
  volumes:
    # Bind mount: host ./upload được mount thẳng vào container nên ảnh đặt trên VPS
    # hiển thị ngay với container — không cần bước copy volume nào.
    # Setup 1 lần trên VPS: chown -R 1001:1001 ./upload  (container chạy uid 1001 appuser)
    - ./upload:/app/upload
```

Mục đích tốt: dùng bind mount để ảnh đẩy lên host **thấy ngay** trong container, bỏ được bước
`docker cp` thủ công của cách cũ.

### Mảnh 2 — CI không bao giờ đồng bộ file compose lên VPS

Trong `.github/workflows/ci-cd-pipeline.yml`, bước `scp-action` **chỉ** copy `scripts/*.sh`:

```yaml
# scp-action — source CHỈ có scripts/*.sh, KHÔNG có docker-compose.prod.yaml
source: 'scripts/*.sh'
target: '~/shopee-project/scripts/'
```

→ Dù commit có sửa `docker-compose.prod.yaml`, bản mới **không bao giờ** được copy sang VPS.

### Mảnh 3 — `deploy.sh` (bản cũ) không git-sync file compose

`scripts/deploy.sh` đọc compose file từ đĩa local của VPS:

```bash
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yaml"
```

…nhưng bản cũ **không** chạy `git pull/fetch/checkout` gì cả trước khi gọi `docker compose`.
VPS là **pull-only** (chỉ `docker pull` + `docker compose up -d`, không `--build`), nên file compose
trên đĩa VPS chỉ là bản đã có sẵn từ lần `git clone`/checkout thủ công trước đó.

### Kết quả khi ghép 3 mảnh

```
Commit đổi sang bind mount  ──X──►  (CI không scp compose)  ──X──►  VPS vẫn giữ compose CŨ
                                    (deploy.sh không git-sync)        → named volume

⇒ Container `shopee-api` vẫn mount /app/upload TỪ NAMED VOLUME cũ
⇒ Ảnh ta scp lên ~/shopee-project/upload/product/ (đường bind mount) KHÔNG được container đọc
⇒ Express trả 404 cho mọi /images/... → ảnh sản phẩm vỡ
```

> **Bản chất**: thay đổi cấu hình hạ tầng (compose) bị "kẹt" ở repo/GitHub, không lan tới được runtime
> trên VPS. Code và ảnh đều đúng — chỉ có lớp mount ở giữa là sai.

---

## 4. Cách chẩn đoán

Chuỗi suy luận để đi từ triệu chứng → kết luận "đây chính là nguyên nhân":

### Bước 1 — Loại trừ lỗi code

Code serve ảnh chạy đúng ở local/dev với cùng logic `path.dirname(__dirname)`. Không có commit nào
sửa logic serve ảnh. → Loại trừ lỗi code.

### Bước 2 — Xác nhận ảnh thật sự có trên đĩa VPS

```bash
# Trên VPS, tại thư mục chứa compose:
ls -la ~/shopee-project/upload/product/ | head
```

Ảnh có thật trong thư mục bind mount của host. → Loại trừ "thiếu ảnh".

### Bước 3 — Hỏi: container đang đọc `/app/upload` từ ĐÂU?

Đây là câu hỏi quyết định. Kiểm tra mount thực tế của container đang chạy:

```bash
# Xem container shopee-api map /app/upload ra đâu
docker inspect <container_shopee-api> \
  --format '{{ range .Mounts }}{{ .Type }} {{ .Source }} -> {{ .Destination }}{{"\n"}}{{ end }}'
```

- Nếu thấy `volume  /var/lib/docker/volumes/..._data -> /app/upload` → container đang dùng **named
  volume** (BẢN CŨ) — đây chính là bằng chứng.
- Nếu thấy `bind  /home/prod/shopee-project/upload -> /app/upload` → đã đúng bind mount (BẢN MỚI).

Tại thời điểm bug, kết quả là **named volume** → khớp với giả thuyết.

### Bước 4 — Đối chiếu compose file trên VPS với origin/master

```bash
# So sánh bản trên đĩa VPS với bản mới nhất trên git
git -C ~/shopee-project fetch origin
git -C ~/shopee-project diff origin/master -- docker-compose.prod.yaml
```

Nếu `diff` cho thấy VPS vẫn còn dùng `volumes: - shopee_upload_data:/app/upload` (named volume)
trong khi `origin/master` đã là `- ./upload:/app/upload` (bind mount) → **xác nhận VPS đang chạy
compose cũ**. Đây là bằng chứng cuối cùng đóng đinh nguyên nhân.

### Bước 5 — Truy ngược "vì sao compose cũ không được cập nhật"

- Đọc `.github/workflows/ci-cd-pipeline.yml`: `scp-action` chỉ copy `scripts/*.sh` → CI không sync compose.
- Đọc `scripts/deploy.sh` (bản cũ): không có lệnh git nào → deploy.sh không tự sync compose.
- → Khép kín chuỗi nhân quả ở [Mục 3](#3-nguồn-gốc-vấn-đề).

---

## 5. Hướng fix

### 5.1 Fix tức thời trên VPS

Mục tiêu: đưa compose mới (bind mount) vào hiệu lực **ngay**, không chờ pipeline.

```bash
cd ~/shopee-project

# 1. Kéo đúng bản compose mới từ git (CHỈ file compose, không reset toàn repo
#    để tránh đụng .env.prod, upload/, backups/ là state riêng của VPS)
git fetch origin
git checkout origin/master -- docker-compose.prod.yaml

# 2. Cấp quyền cho thư mục bind mount (container chạy uid 1001 = appuser)
chown -R 1001:1001 ./upload

# 3. Recreate container để áp dụng cấu hình mount mới
#    (đổi volume bắt buộc phải recreate, không restart suông được)
docker compose -f docker-compose.prod.yaml up -d --no-deps --force-recreate shopee-api

# 4. Xác nhận lại mount đã đúng bind mount
docker inspect $(docker compose -f docker-compose.prod.yaml ps -q shopee-api) \
  --format '{{ range .Mounts }}{{ .Type }} {{ .Source }} -> {{ .Destination }}{{"\n"}}{{ end }}'
```

Sau bước này ảnh sản phẩm hiển thị trở lại (đã xác nhận bằng ảnh chụp màn hình từ site thật).

### 5.2 Fix vĩnh viễn trong `deploy.sh` (Option B)

Để bug này **không bao giờ tái diễn**, `scripts/deploy.sh` được bổ sung **"Step 0"**: tự đồng bộ
`docker-compose.prod.yaml` từ `origin/master` ngay đầu mỗi lần deploy, **trước** mọi thao tác
`docker compose`. Như vậy file compose trên VPS luôn khớp với commit đang được deploy.

```bash
# ---------------------------------------------------------------------------
# Step 0: Sync docker-compose.prod.yaml from origin/master.
# CI only scps scripts/*.sh to the VPS; it never scps the compose file.
# Without this step, a commit that changes docker-compose.prod.yaml would
# never reach the VPS disk, and docker compose would keep running the old
# file.  We fetch and checkout just that one file so we never clobber
# VPS-local state (.env.prod, upload/, backups/, etc.).
# ---------------------------------------------------------------------------
if git -C "$PROJECT_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  retry_with_backoff 3 5 git -C "$PROJECT_ROOT" fetch origin
  git -C "$PROJECT_ROOT" checkout origin/master -- docker-compose.prod.yaml
  echo "==> Synced docker-compose.prod.yaml from origin/master"
else
  echo "WARNING: $PROJECT_ROOT is not a git repository — skipping compose file sync. Using existing $COMPOSE_FILE as-is." >&2
fi
```

Điểm quan trọng của thiết kế này:

| Đặc tính                                    | Lý do                                                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `checkout origin/master -- <file>` (scoped) | Chỉ lấy đúng 1 file compose, **không** `git reset --hard` toàn repo → không đụng `.env.prod`, `upload/`, `backups/` (state riêng của VPS) |
| Guard `git rev-parse --git-dir`             | Nếu thư mục không phải git repo thì **cảnh báo & tiếp tục**, không làm fail deploy                                                        |
| `retry_with_backoff 3 5` cho `fetch`        | Chịu được lỗi mạng/registry tạm thời, đúng phong cách các bước khác trong file                                                            |
| Đặt ở Step 0 (trước docker compose)         | Bảo đảm `docker compose` luôn đọc file compose mới nhất                                                                                   |

---

## 6. Quy trình đưa ảnh lên VPS

### Cách CŨ (KHÔNG dùng nữa)

```bash
# ❌ Lỗi thời: copy ảnh vào trong container rồi chown bên trong container
docker cp ./product/. <container>:/app/upload/product/
docker exec <container> chown -R 1001:1001 /app/upload
```

Nhược điểm: ảnh nằm trong lớp ghi của container, **mất khi recreate container**, và phải thao tác
thủ công mỗi lần deploy.

### Cách MỚI (bind mount — đang dùng)

```bash
# ✅ Đẩy ảnh thẳng lên thư mục host được bind mount
# (từ máy local)
rsync -avz ./product/ prod@interdata:~/shopee-project/upload/product/
# hoặc: scp -r ./product/* prod@interdata:~/shopee-project/upload/product/

# (trên VPS, 1 lần — hoặc sau mỗi lần thêm ảnh mới)
cd ~/shopee-project
chown -R 1001:1001 ./upload
```

Ưu điểm: ảnh nằm trên đĩa host, **không mất khi recreate container**, container thấy ngay lập tức
(không cần copy lại). `chown 1001:1001` để user `appuser` (uid 1001) trong container đọc được file.

---

## 7. Checklist phòng ngừa

- [ ] Khi sửa `docker-compose.prod.yaml`, nhớ rằng CI **không** tự đẩy file này lên VPS — `deploy.sh`
      Step 0 mới là cơ chế đồng bộ. Đừng giả định scp lo việc đó.
- [ ] Sau khi đổi `volumes:` (named volume ↔ bind mount), **bắt buộc recreate** container
      (`--force-recreate`), không restart suông.
- [ ] Mỗi lần thêm ảnh mới lên VPS: `chown -R 1001:1001 ./upload` để uid 1001 trong container đọc được.
- [ ] Khi ảnh không hiển thị mà code không đổi → kiểm tra **mount thực tế** của container trước tiên
      (`docker inspect ... .Mounts`), đừng vội nghi code.
- [ ] Định kỳ đối chiếu compose trên VPS với git: `git diff origin/master -- docker-compose.prod.yaml`.

---

## Liên quan

- `docs/ZZ_15_CICD_DEPLOY_FLOW_VPS.md` — luồng CI/CD & deploy VPS tổng thể (mục 8.2, 8.4 mô tả bind
  mount, `chown 1001:1001`, uid 1001 appuser).
- `scripts/deploy.sh` — chứa Step 0 (Option B) tự đồng bộ compose file.
- `docker-compose.prod.yaml` — định nghĩa bind mount `./upload:/app/upload` cho `shopee-api`.
- `apps/shopee-api/src/index.ts` — cấu hình serve ảnh tĩnh ở route `/images`.
