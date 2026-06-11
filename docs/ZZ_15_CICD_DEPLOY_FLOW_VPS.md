# ZZ_15 — Giải Thích Chi Tiết Flow Deploy Lên VPS (CI/CD Pipeline + deploy.sh)

> Tài liệu này giải thích **từng bước một** cách ứng dụng Shopee được build và deploy tự động lên VPS,
> bắt đầu từ lúc bạn `git push` lên nhánh `master` cho đến khi cả 3 service chạy khỏe mạnh trên VPS.
>
> Mục tiêu: đọc xong tài liệu này, bạn hiểu **chính xác từng dòng lệnh** đang làm gì và **tại sao** nó được viết như vậy.

---

## Mục Lục

1. [Bức tranh tổng thể (Big Picture)](#1-bức-tranh-tổng-thể-big-picture)
2. [Các thành phần tham gia](#2-các-thành-phần-tham-gia)
3. [Sơ đồ flow toàn bộ](#3-sơ-đồ-flow-toàn-bộ)
4. [Phần A — CI/CD Pipeline (chạy trên GitHub Actions)](#4-phần-a--cicd-pipeline-chạy-trên-github-actions)
   - [Job 1: Quality (lint + format)](#job-1-quality-lint--format)
   - [Job 2: Build & Push (3 Docker images)](#job-2-build--push-3-docker-images)
   - [Job 3: Deploy to VPS](#job-3-deploy-to-vps)
5. [Phần B — deploy.sh (chạy trên VPS), giải thích từng dòng](#5-phần-b--deploysh-chạy-trên-vps-giải-thích-từng-dòng)
6. [Phần C — health-check.sh giải thích từng dòng](#6-phần-c--health-checksh-giải-thích-từng-dòng)
7. [Phần D — rollback.sh giải thích từng dòng](#7-phần-d--rollbacksh-giải-thích-từng-dòng)
8. [Phần E — docker-compose.prod.yaml](#8-phần-e--docker-composeprodyaml)
9. [Đối chiếu với log thực tế của bạn](#9-đối-chiếu-với-log-thực-tế-của-bạn)
10. [Bảng tra cứu nhanh (Cheat sheet)](#10-bảng-tra-cứu-nhanh-cheat-sheet)
11. [Câu hỏi thường gặp (FAQ)](#11-câu-hỏi-thường-gặp-faq)

---

## 1. Bức Tranh Tổng Thể (Big Picture)

Toàn bộ hệ thống deploy được thiết kế theo triết lý ghi ở đầu file `CLAUDE.md`:

> **一度正しく、永遠に動く — Làm đúng một lần, chạy mãi mãi.**

Ý tưởng cốt lõi rất đơn giản, gồm đúng **3 bước nối tiếp nhau**:

```
Bạn push code  ──►  [1] Kiểm tra chất lượng  ──►  [2] Build + đẩy image  ──►  [3] SSH vào VPS deploy
   (git push)          (lint + format)             (lên Docker Hub)            (rolling update + health check)
```

Điểm mấu chốt cần nhớ:

- **3 job chạy TUẦN TỰ**, không song song. Job sau chỉ chạy nếu job trước **thành công** (nhờ từ khóa `needs:`).
- **Image được gắn tag theo SHA commit** (ví dụ `sha-418a594`). Tag này là **bất biến (immutable)** — mỗi commit ra một image riêng, không bao giờ ghi đè. Đây là nền tảng để rollback an toàn.
- VPS **không build code**. VPS chỉ **kéo image đã build sẵn** từ Docker Hub về và chạy. Việc build nặng nề đã xảy ra trên GitHub Actions runner.
- Sau khi deploy, script tự **health check**. Nếu fail thì tự động **rollback** về phiên bản tốt trước đó. Bạn không cần can thiệp tay.

---

## 2. Các Thành Phần Tham Gia

| Thành phần                   | Vai trò                                                    | Nằm ở đâu                          |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------- |
| `ci-cd-pipeline.yml`         | Định nghĩa toàn bộ pipeline (3 job)                        | `.github/workflows/`               |
| `setup-node-pnpm/action.yml` | Composite action: cài Node 22 + pnpm + cache               | `.github/actions/setup-node-pnpm/` |
| `Dockerfile` (×3)            | Công thức build image cho api / web / admin                | `apps/shopee-*/`                   |
| `deploy.sh`                  | Kịch bản deploy chính, chạy **trên VPS**                   | `scripts/`                         |
| `health-check.sh`            | Kiểm tra service có sống không (HTTP 200)                  | `scripts/`                         |
| `rollback.sh`                | Khôi phục về SHA tốt trước đó khi deploy fail              | `scripts/`                         |
| `docker-compose.prod.yaml`   | Định nghĩa stack production (3 service + network + volume) | gốc dự án                          |
| Docker Hub                   | Nơi lưu trữ image đã build                                 | Cloud                              |
| VPS                          | Máy chủ chạy ứng dụng thật                                 | Cloud (của bạn)                    |

**3 service chính:**

| Service        | Là gì                                                | Cổng nội bộ container | Cổng map trên VPS (chỉ localhost) |
| -------------- | ---------------------------------------------------- | --------------------- | --------------------------------- |
| `shopee-api`   | Backend NestJS/Express                               | 4000                  | `127.0.0.1:8083`                  |
| `shopee-web`   | Frontend khách hàng (React + Vite, serve bằng Nginx) | 8080                  | `127.0.0.1:8081`                  |
| `shopee-admin` | Trang quản trị (React + Vite, serve bằng Nginx)      | 8080                  | `127.0.0.1:8082`                  |

> **Lưu ý quan trọng về bảo mật:** cả 3 cổng đều bind vào `127.0.0.1` (chỉ nghe trên chính VPS), **không** mở ra Internet trực tiếp. Thường sẽ có một **reverse proxy** (Nginx host hoặc tương tự) đứng trước, nhận request từ ngoài rồi chuyển vào các cổng này. Đây là lý do health check trong log gọi `http://127.0.0.1:8083/health`.

---

## 3. Sơ Đồ Flow Toàn Bộ

```
┌──────────────────────────────────────────────────────────────────────────┐
│  DEVELOPER MACHINE                                                         │
│  git push origin master                                                    │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │ (trigger: on push to master)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (runner: ubuntu-latest)                                    │
│                                                                            │
│  ┌────────────────────┐                                                    │
│  │ JOB 1: quality     │  pnpm nx lint + format:check                       │
│  │ (cổng gác / gate)  │  ─ FAIL ─► dừng toàn bộ, KHÔNG build, KHÔNG deploy │
│  └─────────┬──────────┘                                                    │
│            │ needs: quality (chỉ chạy nếu PASS)                            │
│            ▼                                                                │
│  ┌────────────────────────────────────────────────┐                       │
│  │ JOB 2: build-and-push  (matrix 3 nhánh song song)│                      │
│  │   ├─ shopee-api   ─► docker build ─► push DockerHub                     │
│  │   ├─ shopee-web   ─► docker build ─► push DockerHub                     │
│  │   └─ shopee-admin ─► docker build ─► push DockerHub                     │
│  │   Tag: sha-<7 ký tự đầu của commit> + latest                           │
│  └─────────┬────────────────────────────────────────┘                     │
│            │ needs: build-and-push                                         │
│            ▼                                                                │
│  ┌────────────────────┐                                                    │
│  │ JOB 3: deploy      │  appleboy/ssh-action ──SSH──►  VPS                 │
│  │ (environment: prod)│                                                    │
│  └─────────┬──────────┘                                                    │
└────────────┼───────────────────────────────────────────────────────────────┘
             │ SSH chạy lệnh: ./scripts/deploy.sh <REGISTRY> <TAG> <SERVICES>
             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  VPS (máy chủ của bạn)                                                     │
│                                                                            │
│  deploy.sh:                                                                │
│   1. Ghi nhớ SHA đang chạy (chưa lưu file vội)                            │
│   2. docker login Docker Hub                                              │
│   3. docker pull 3 image mới (theo tag SHA)                               │
│   4. docker compose up -d từng service (rolling update)                   │
│   5. health-check.sh ──► gọi HTTP tới 3 service                           │
│        ├─ PASS ─► lưu .previous-sha + dọn image cũ ─► XONG ✅             │
│        └─ FAIL ─► rollback.sh về SHA tốt trước đó ─► ❌ exit 1            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Phần A — CI/CD Pipeline (chạy trên GitHub Actions)

File: `.github/workflows/ci-cd-pipeline.yml`

### Phần khai báo trigger (đầu file)

```yaml
on:
  push:
    branches: [master]
  workflow_dispatch:
```

- `push.branches: [master]` — pipeline tự chạy mỗi khi có commit được đẩy lên nhánh `master`. Vì đây là dự án cá nhân nên push thẳng master luôn (không qua pull request).
- `workflow_dispatch` — cho phép bạn **bấm nút chạy thủ công** trong tab Actions của GitHub, không cần push code. Hữu ích khi muốn deploy lại mà không sửa gì.

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false
```

- `concurrency` — cơ chế chống chạy chồng chéo. Nếu bạn push 2 lần liên tiếp, GitHub gom chúng vào cùng một "group".
- `cancel-in-progress: false` — lần chạy đang diễn ra **sẽ không bị hủy** giữa chừng. Lần mới sẽ **xếp hàng đợi** lần cũ xong rồi mới chạy. Điều này cực kỳ quan trọng với deploy: hủy giữa chừng một lần deploy có thể để lại VPS ở trạng thái dở dang.

---

### Job 1: Quality (lint + format)

```yaml
quality:
  name: Quality (lint + format)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node + pnpm
      uses: ./.github/actions/setup-node-pnpm
    - name: Lint all projects
      run: pnpm nx run-many -t lint --exclude=@shopee/source
    - name: Format check
      run: pnpm nx format:check --all
```

Đây là **cổng gác (gate)**. Mọi thứ phải qua được đây thì pipeline mới đi tiếp.

| Bước     | Lệnh                                                | Ý nghĩa                                                                             |
| -------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Checkout | `actions/checkout@v4`                               | Tải mã nguồn của commit hiện tại về máy runner                                      |
| Setup    | `./.github/actions/setup-node-pnpm`                 | Gọi composite action (xem bên dưới) để chuẩn bị môi trường                          |
| Lint     | `pnpm nx run-many -t lint --exclude=@shopee/source` | Chạy ESLint cho **tất cả** project trong monorepo, trừ project tên `@shopee/source` |
| Format   | `pnpm nx format:check --all`                        | Kiểm tra code có đúng định dạng Prettier không (chỉ **check**, không tự sửa)        |

**Composite action `setup-node-pnpm/action.yml` làm gì:**

```yaml
steps:
  - run: corepack enable # bật corepack để quản lý pnpm
  - uses: actions/setup-node@v4 # cài Node.js phiên bản 22
    with: { node-version: 22 }
  - run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV # lấy đường dẫn pnpm store
  - uses: actions/cache@v4 # cache pnpm store để lần sau cài nhanh hơn
    with:
      path: ${{ env.STORE_PATH }}
      key: pnpm-store-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
  - if: ${{ inputs.install == 'true' }}
    run: pnpm install --frozen-lockfile # cài dependencies, khóa đúng theo lockfile
```

- **`corepack enable`** — Corepack là công cụ đi kèm Node.js, cho phép dùng đúng phiên bản pnpm đã pin trong dự án mà không cần `npm install -g pnpm`.
- **Cache pnpm store** — key cache dựa trên hash của `pnpm-lock.yaml`. Nếu lockfile không đổi → tái dùng cache → cài cực nhanh. Nếu lockfile đổi → tạo cache mới.
- **`--frozen-lockfile`** — bắt buộc cài đúng y hệt những gì ghi trong lockfile. Nếu lockfile và `package.json` lệch nhau → **báo lỗi ngay** thay vì âm thầm cập nhật. Đảm bảo build tái lập được (reproducible).

> **Nếu job này FAIL:** pipeline dừng tại đây. Không có image nào được build, VPS hoàn toàn không bị động chạm. Đây là tác dụng "cổng gác" — code lỗi format/lint không bao giờ ra production.

---

### Job 2: Build & Push (3 Docker images)

```yaml
build-and-push:
  name: Build & Push (${{ matrix.app }})
  runs-on: ubuntu-latest
  needs: quality # ← chỉ chạy nếu Job 1 PASS
  strategy:
    fail-fast: false
    matrix:
      include:
        - app: shopee-api   ...
        - app: shopee-web   ...
        - app: shopee-admin ...
```

**`needs: quality`** là sợi dây xích — job này chỉ bắt đầu khi `quality` xanh.

**Matrix strategy** = một "khuôn" job được nhân bản thành **3 job song song**, mỗi job build một app. Trong log của bạn, đây chính là 3 dòng:

- `Build & Push (shopee-api)`
- `Build & Push (shopee-web)`
- `Build & Push (shopee-admin)`

**`fail-fast: false`** — nếu một nhánh (ví dụ `shopee-web`) fail, **2 nhánh kia vẫn chạy tiếp** đến cùng. Mặc định GitHub sẽ hủy hết khi một nhánh fail; ở đây ta tắt hành vi đó để thấy đầy đủ nhánh nào hỏng.

**Các step bên trong mỗi nhánh matrix:**

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: docker/setup-buildx-action@v3 # bật Buildx (build engine nâng cao của Docker)
  - uses: docker/login-action@v3 # đăng nhập Docker Hub
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }}
  - id: sha # tính SHA ngắn (7 ký tự đầu)
    run: echo "short=$(echo '${{ github.sha }}' | cut -c1-7)" >> $GITHUB_OUTPUT
  - uses: docker/build-push-action@v6 # build + push image
    with:
      context: .
      file: ${{ matrix.dockerfile }}
      push: true
      tags: |
        ${{ secrets.DOCKERHUB_USERNAME }}/${{ matrix.app }}:sha-${{ steps.sha.outputs.short }}
        ${{ secrets.DOCKERHUB_USERNAME }}/${{ matrix.app }}:latest
      build-args: ${{ matrix.build-args }}
      cache-from: type=gha,scope=${{ matrix.app }}
      cache-to: type=gha,mode=max,scope=${{ matrix.app }}
```

Giải thích từng phần:

- **`setup-buildx-action`** — bật BuildKit/Buildx, công cụ build hiện đại của Docker, hỗ trợ cache layer thông minh và build đa stage hiệu quả.
- **`login-action`** — đăng nhập Docker Hub bằng secret `DOCKERHUB_USERNAME` và `DOCKERHUB_TOKEN` (cấu hình trong Settings → Secrets của GitHub repo). Cần đăng nhập để có quyền `push`.
- **Tính SHA ngắn:** `github.sha` là mã commit đầy đủ (40 ký tự). `cut -c1-7` lấy 7 ký tự đầu → ví dụ `418a594`. Kết quả ghi vào `$GITHUB_OUTPUT` để step sau dùng lại qua `steps.sha.outputs.short`.
- **`tags`** — mỗi image được gắn **2 tag**:
  - `<user>/<app>:sha-418a594` — tag bất biến theo commit, dùng để deploy chính xác và rollback.
  - `<user>/<app>:latest` — tag "mới nhất", tiện cho người xem nhưng **không** dùng để deploy (vì `latest` thay đổi liên tục, không đảm bảo rollback an toàn).
- **`build-args`** — biến truyền vào lúc build. **Đây là điểm quan trọng cần hiểu rõ:**

```yaml
# shopee-web build-args:
VITE_API_BASE_URL=${{ vars.VITE_API_BASE_URL_PROD }}
VITE_SOCKET_URL=${{ vars.VITE_SOCKET_URL_PROD }}
VITE_SITE_URL=${{ vars.VITE_SITE_URL_PROD }}
VITE_STRIPE_PUBLISHABLE_KEY=${{ vars.VITE_STRIPE_PUBLISHABLE_KEY_PROD }}

# shopee-admin build-args:
VITE_API_BASE_URL=${{ vars.VITE_API_BASE_URL_PROD }}
VITE_SOCKET_URL=${{ vars.VITE_SOCKET_URL_PROD }}
VITE_APP_VERSION=${{ vars.VITE_APP_VERSION_PROD }}
```

Với app React + Vite, biến `VITE_*` được **nhúng cứng (inline) vào bundle JS lúc build**. Nghĩa là URL API, URL socket, key Stripe... bị "đóng băng" vào file JS ngay tại bước build này, **không phải** lúc chạy. Đó là lý do chúng phải có mặt ở đây chứ không phải trong `deploy.sh`.

> ⚠️ Đây cũng là nguồn gốc của các dòng cảnh báo `level=warning msg="The VITE_API_BASE_URL variable is not set..."` mà bạn thấy trong log VPS. Xem [mục 9](#9-đối-chiếu-với-log-thực-tế-của-bạn) để hiểu vì sao **warning này vô hại**.

- **`cache-from` / `cache-to` với `type=gha`** — dùng GitHub Actions Cache để lưu các layer Docker đã build. `scope=${{ matrix.app }}` tách cache riêng cho từng app (api/web/admin không đụng cache của nhau). `mode=max` lưu cache cho **mọi** layer trung gian, không chỉ layer cuối → lần build sau nhanh hơn nhiều.

**Tóm tắt Job 2:** lấy code → build 3 Docker image theo công thức trong từng `Dockerfile` → push lên Docker Hub với 2 tag. Sau job này, trên Docker Hub đã có sẵn 3 image mới chờ VPS kéo về.

---

### Job 3: Deploy to VPS

```yaml
deploy:
  name: Deploy to VPS
  runs-on: ubuntu-latest
  needs: build-and-push # ← chỉ chạy khi cả 3 image build xong
  environment: production
  steps:
    - name: Deploy via SSH
      uses: appleboy/ssh-action@v1.2.0
      env:
        DOCKERHUB_TOKEN: ${{ secrets.DOCKERHUB_TOKEN }}
        DOCKERHUB_USERNAME: ${{ secrets.DOCKERHUB_USERNAME }}
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USER }}
        key: ${{ secrets.VPS_SSH_KEY }}
        port: ${{ secrets.VPS_SSH_PORT }}
        envs: DOCKERHUB_TOKEN,DOCKERHUB_USERNAME
        command_timeout: 15m
        script: |
          REGISTRY="${DOCKERHUB_USERNAME}"
          IMAGE_TAG="sha-$(echo '${{ github.sha }}' | cut -c1-7)"
          cd "$HOME/shopee-project" || exit 1
          chmod +x scripts/*.sh
          ./scripts/deploy.sh "$REGISTRY" "$IMAGE_TAG" "shopee-api shopee-web shopee-admin"
```

Đây là job cuối, tương ứng với mục `Deploy to VPS` → step `Deploy via SSH` trong log của bạn.

- **`needs: build-and-push`** — chỉ deploy khi cả 3 image đã build & push thành công.
- **`environment: production`** — gán job này vào "environment" tên `production` của GitHub. Cho phép áp dụng quy tắc bảo vệ (protection rules), ví dụ yêu cầu phê duyệt thủ công, hoặc giới hạn secret chỉ dùng được trong môi trường này.
- **`appleboy/ssh-action@v1.2.0`** — action chuyên dùng để **SSH vào máy từ xa và chạy lệnh**. Nó mở kết nối SSH tới VPS rồi thực thi đoạn `script:`.
- **`env` + `envs`** — hai dòng này phối hợp với nhau:
  - `env:` định nghĩa biến `DOCKERHUB_TOKEN`, `DOCKERHUB_USERNAME` ở phía runner GitHub.
  - `envs: DOCKERHUB_TOKEN,DOCKERHUB_USERNAME` ra lệnh cho action **mang hai biến đó qua phiên SSH** để bên trong VPS dùng được. `deploy.sh` cần chúng để `docker login`.
- **Thông số kết nối SSH** (`host`, `username`, `key`, `port`) đều lấy từ secret — không lộ trong code.
- **`command_timeout: 15m`** — giới hạn 15 phút cho toàn bộ phiên SSH. Comment trong file giải thích con số này: health check chạy tối đa `30 lần × 5 giây × 3 service ≈ 450 giây (~8 phút)`. Đặt 15 phút để có biên độ an toàn thoải mái, tránh bị treo ở giá trị mặc định.

**Đoạn `script:` chạy gì trên VPS:**

| Dòng | Lệnh                                                                                | Ý nghĩa                                                                         |
| ---- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1    | `REGISTRY="${DOCKERHUB_USERNAME}"`                                                  | Lấy username Docker Hub làm registry (vd: `lehoangtrong`)                       |
| 2    | `IMAGE_TAG="sha-$(echo '${{ github.sha }}' \| cut -c1-7)"`                          | Tạo lại tag SHA y hệt Job 2 (vd: `sha-418a594`) để pull đúng image vừa build    |
| 3    | `cd "$HOME/shopee-project" \|\| exit 1`                                             | Vào thư mục dự án trên VPS. Nếu không vào được → thoát ngay với lỗi             |
| 4    | `chmod +x scripts/*.sh`                                                             | Cấp quyền thực thi cho mọi script `.sh` (phòng khi quyền bị mất sau `git pull`) |
| 5    | `./scripts/deploy.sh "$REGISTRY" "$IMAGE_TAG" "shopee-api shopee-web shopee-admin"` | **Gọi deploy.sh** với 3 tham số: registry, tag, danh sách service               |

> Lưu ý: GitHub Actions chỉ chịu trách nhiệm đến bước "gọi `deploy.sh`". Từ đây trở đi, **mọi thứ chạy trên VPS** — phần B bên dưới.

## 5. Phần B — deploy.sh (chạy trên VPS), Giải Thích Từng Dòng

File: `scripts/deploy.sh` (201 dòng). Đây là **trái tim** của toàn bộ quá trình deploy. Dưới đây ta đi qua **từng khối, từng dòng** theo đúng thứ tự file.

### 5.0. Hai dòng đầu — "luật chơi" của cả script

```bash
#!/usr/bin/env bash
set -euo pipefail
```

- **`#!/usr/bin/env bash`** (gọi là _shebang_) — dòng này báo cho hệ điều hành: "hãy chạy file này bằng **bash**". Dùng `/usr/bin/env bash` thay vì `/bin/bash` cứng để tìm bash ở bất kỳ đâu trong `PATH` (linh hoạt hơn giữa các bản Linux khác nhau).
- **`set -euo pipefail`** — đây là **lá chắn an toàn** quan trọng nhất. Nó gồm 4 cờ gộp lại:

| Cờ            | Tên đầy đủ | Ý nghĩa — "nếu có sự cố thì..."                                                                                                                                    |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `-e`          | errexit    | ...**dừng ngay** khi bất kỳ lệnh nào trả về lỗi (exit code ≠ 0). Không "nhắm mắt chạy tiếp" gây hỏng hóc dây chuyền.                                               |
| `-u`          | nounset    | ...**báo lỗi** nếu dùng một biến chưa được khai báo (vd gõ sai tên biến `$REGISTYR`). Bắt lỗi gõ nhầm ngay.                                                        |
| `-o pipefail` | pipefail   | ...trong chuỗi `A \| B \| C`, nếu **bất kỳ** lệnh nào trong ống dẫn (pipe) fail thì cả chuỗi tính là fail. Mặc định bash chỉ quan tâm lệnh cuối — rất dễ giấu lỗi. |

> 💡 **Vì sao quan trọng với deploy?** Khi deploy, một lệnh fail mà vẫn chạy tiếp có thể đẩy VPS vào trạng thái nửa vời (service A mới, service B cũ, không ai biết). `set -euo pipefail` đảm bảo "fail nhanh, fail rõ ràng" thay vì "fail âm thầm".

---

### 5.1. Khối đọc tham số đầu vào (dòng 14–28)

```bash
REGISTRY="${1:-}"
IMAGE_TAG="${2:-}"
# Remaining args are services
shift 2 2>/dev/null || true
SERVICES="${*:-}"
```

Nhớ lại Job 3 gọi: `./scripts/deploy.sh "$REGISTRY" "$IMAGE_TAG" "shopee-api shopee-web shopee-admin"`. Vậy script nhận **3 nhóm tham số**:

| Dòng | Lệnh                            | Giải thích cặn kẽ                                                                                                                                                                                                                                            |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 14   | `REGISTRY="${1:-}"`             | Lấy **tham số thứ 1** (`$1`, vd `lehoangtrong`) gán vào biến `REGISTRY`. Cú pháp `${1:-}` nghĩa là: "nếu `$1` rỗng/không có thì dùng giá trị mặc định là **rỗng**". Đây là mẹo để tránh lỗi `-u` (nounset) khi tham số thiếu.                                |
| 15   | `IMAGE_TAG="${2:-}"`            | Tương tự, lấy **tham số thứ 2** (`$2`, vd `sha-418a594`) — tag SHA của image cần deploy.                                                                                                                                                                     |
| 17   | `shift 2 2>/dev/null \|\| true` | **`shift 2`** = "vứt bỏ 2 tham số đầu", để những gì còn lại (`$3`, `$4`, ...) trở thành các service. `2>/dev/null` nuốt thông báo lỗi nếu có ít hơn 2 tham số. `\|\| true` đảm bảo dù `shift` fail thì dòng này vẫn coi như thành công (không bị `-e` giết). |
| 18   | `SERVICES="${*:-}"`             | **`$*`** = "tất cả tham số còn lại sau `shift`", gộp thành một chuỗi. Ở đây là `shopee-api shopee-web shopee-admin`.                                                                                                                                         |

> 🧠 **Hiểu sâu `shift`:** Hãy tưởng tượng tham số xếp hàng `[REGISTRY] [TAG] [api] [web] [admin]`. Sau `shift 2`, hai ô đầu bị bỏ đi, hàng còn `[api] [web] [admin]` — và `$*` gom đúng 3 service này.

```bash
if [ -z "$REGISTRY" ] || [ -z "$IMAGE_TAG" ] || [ -z "$SERVICES" ]; then
  echo "ERROR: Missing required arguments." >&2
  ...
  exit 1
fi
```

- **`[ -z "$X" ]`** = "biến X **rỗng** (zero length) hay không".
- **`||`** = "hoặc". Câu lệnh đọc là: "nếu REGISTRY rỗng **hoặc** TAG rỗng **hoặc** SERVICES rỗng thì...".
- **`>&2`** = đẩy dòng `echo` ra **luồng lỗi chuẩn (stderr)** thay vì luồng ra bình thường (stdout). Đây là quy ước: thông báo lỗi nên đi vào stderr để công cụ log phân biệt được.
- **`exit 1`** = thoát script với mã lỗi 1 (khác 0 = thất bại). Pipeline GitHub sẽ thấy mã này và báo job đỏ.

> ✅ **Ý nghĩa thực tế:** đây là "kiểm tra đầu vào". Nếu ai đó chạy `deploy.sh` mà quên truyền tham số, script **từ chối chạy ngay** kèm hướng dẫn cách dùng, thay vì chạy lung tung rồi hỏng.

---

### 5.2. Khối tính đường dẫn (dòng 30–39)

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yaml"
BACKUPS_DIR="$PROJECT_ROOT/backups"
PREVIOUS_SHA_FILE="$BACKUPS_DIR/.previous-sha"

export REGISTRY
export IMAGE_TAG
```

| Dòng  | Lệnh                                   | Giải thích                                                                                                                                                                                                                                                                     |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 30    | `SCRIPT_DIR=...`                       | Tìm **thư mục chứa chính file deploy.sh**, dù bạn gọi nó từ đâu. `${BASH_SOURCE[0]}` là đường dẫn tới chính script này; `dirname` lấy phần thư mục; `cd ... && pwd` chuyển vào đó rồi in đường dẫn tuyệt đối. Kết quả: vd `/home/user/shopee-project/scripts`.                 |
| 31    | `PROJECT_ROOT=...`                     | Lùi lên một cấp (`/..`) từ `scripts/` → ra **gốc dự án** `/home/user/shopee-project`.                                                                                                                                                                                          |
| 33    | `COMPOSE_FILE=...`                     | Đường dẫn đầy đủ tới file compose production.                                                                                                                                                                                                                                  |
| 34    | `BACKUPS_DIR=...`                      | Thư mục `backups/` — nơi lưu "trí nhớ" về phiên bản tốt trước đó.                                                                                                                                                                                                              |
| 35    | `PREVIOUS_SHA_FILE=...`                | File `.previous-sha` bên trong `backups/` — chứa **đúng 1 dòng** là SHA của phiên bản healthy gần nhất. Đây là "mỏ neo" để rollback.                                                                                                                                           |
| 38–39 | `export REGISTRY` / `export IMAGE_TAG` | **Cực kỳ quan trọng:** `export` biến hai biến này thành **biến môi trường**, để khi script gọi `docker compose` thì compose có thể thay `${REGISTRY}` và `${IMAGE_TAG}` trong dòng `image:` của file YAML. Không có `export` → compose sẽ không thấy biến → dùng mặc định sai. |

> 🔑 **Tại sao tính đường dẫn kiểu này thay vì hardcode?** Để script chạy đúng **dù được gọi từ bất kỳ thư mục nào**. Bạn có thể `cd /tmp && /home/user/shopee-project/scripts/deploy.sh ...` mà nó vẫn tìm đúng compose file và backups. Robust hơn nhiều so với việc giả định "luôn chạy từ gốc dự án".

```bash
echo "==> Deploy started: registry=$REGISTRY tag=$IMAGE_TAG services=$SERVICES"
```

- Dòng log mở màn. Mọi dòng `echo "==> ..."` trong file đều là **mốc tiến trình** để bạn đọc log dễ dàng. Đây chính là các dòng `==>` bạn thấy trong terminal khi deploy.

### 5.3. STEP 1 — Ghi nhớ SHA đang chạy (nhưng CHƯA lưu xuống đĩa) (dòng 43–70)

Đây là một trong những đoạn **thông minh nhất** của script. Hãy đọc comment gốc trước:

```bash
# Step 1: Capture current running image SHA into a variable — do NOT write to
# disk yet.  We only persist this to .previous-sha AFTER the new deploy passes
# its health check, ensuring .previous-sha always points at a confirmed-healthy
# SHA rather than whatever happened to be running (which may itself be broken).
```

> 🎯 **Triết lý cốt lõi:** `.previous-sha` (mỏ neo rollback) **chỉ được ghi sau khi bản mới đã healthy**. Lý do: nếu ghi ngay bây giờ, ta có thể vô tình ghi lại một SHA vốn đã **đang hỏng**. Khi đó rollback sẽ "lùi về một bản cũng hỏng" = vô nghĩa. Để đảm bảo `.previous-sha` luôn trỏ tới bản **chắc chắn từng healthy**, ta chỉ ghi nó ở cuối, sau khi health check pass (xem mục 5.7).

```bash
mkdir -p "$BACKUPS_DIR"
```

- **`mkdir -p`** = tạo thư mục `backups/`. Cờ `-p` nghĩa là "tạo cả cây thư mục cha nếu thiếu, và **không báo lỗi** nếu thư mục đã tồn tại". An toàn để gọi mỗi lần.

```bash
PRIOR_SHA=""
for svc in shopee-api shopee-web shopee-admin; do
  CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q "$svc" 2>/dev/null | head -1 || true)
  if [ -n "$CONTAINER_ID" ]; then
    RUNNING_IMAGE=$(docker inspect --format '{{.Config.Image}}' "$CONTAINER_ID" 2>/dev/null || true)
    EXTRACTED=$(echo "$RUNNING_IMAGE" | grep -oE 'sha-[a-f0-9]{7}' | head -1 || true)
    if [ -n "$EXTRACTED" ]; then
      PRIOR_SHA="$EXTRACTED"
      break
    fi
  fi
done
```

Đoạn này trả lời câu hỏi: **"Ngay trước khi deploy, VPS đang chạy phiên bản (SHA) nào?"** Ta đi qua từng dòng:

| Dòng  | Lệnh                                                                              | Giải thích chi tiết                                                                                                                                                                                                                              |
| ----- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 51    | `PRIOR_SHA=""`                                                                    | Khởi tạo biến rỗng. Nếu hết vòng lặp mà vẫn rỗng → nghĩa là không tìm thấy (vd lần deploy đầu tiên, chưa có gì chạy).                                                                                                                            |
| 53    | `for svc in shopee-api shopee-web shopee-admin; do`                               | Lặp qua 3 service. Chỉ cần tìm thấy SHA ở **một** service là đủ (vì cả 3 luôn cùng SHA), nên có `break` ở trong.                                                                                                                                 |
| 54    | `CONTAINER_ID=$(docker compose ... ps -q "$svc" ...)`                             | **`ps -q`** = liệt kê **chỉ ID** (quiet) của container thuộc service đó. **`head -1`** = lấy dòng đầu (phòng khi có nhiều). `2>/dev/null` giấu lỗi, `\|\| true` để không bị `-e` giết nếu service chưa tồn tại.                                  |
| 55    | `if [ -n "$CONTAINER_ID" ]; then`                                                 | **`[ -n "$X" ]`** = "X **không** rỗng". Tức là: chỉ xử lý tiếp nếu thực sự tìm thấy container đang chạy.                                                                                                                                         |
| 56    | `RUNNING_IMAGE=$(docker inspect --format '{{.Config.Image}}' ...)`                | **`docker inspect`** moi thông tin chi tiết của container. **`--format '{{.Config.Image}}'`** dùng template Go để rút ra **đúng tên image** mà container đang chạy, vd `lehoangtrong/shopee-api:sha-d4c7a70`.                                    |
| 58    | `EXTRACTED=$(echo "$RUNNING_IMAGE" \| grep -oE 'sha-[a-f0-9]{7}' \| head -1 ...)` | Dùng **regex** để bóc đúng phần SHA. `grep -oE` = chỉ in (`-o`) phần khớp, dùng regex mở rộng (`-E`). Mẫu `sha-[a-f0-9]{7}` nghĩa là: chữ `sha-` theo sau bởi **đúng 7 ký tự** hex (0–9, a–f). Vậy từ `...:sha-d4c7a70` ta lấy ra `sha-d4c7a70`. |
| 59–62 | `if [ -n "$EXTRACTED" ]; then PRIOR_SHA="$EXTRACTED"; break; fi`                  | Nếu bóc được SHA hợp lệ → lưu vào `PRIOR_SHA` và **`break`** (thoát vòng lặp ngay, không cần kiểm tra 2 service còn lại).                                                                                                                        |

```bash
if [ -n "$PRIOR_SHA" ]; then
  echo "==> Captured prior running SHA: $PRIOR_SHA (will persist only after health check passes)"
else
  echo "==> Could not determine prior running SHA; no rollback target will be recorded."
fi
```

- Chỉ là log thông báo kết quả. Nếu tìm được → in SHA cũ ra. Nếu không (lần deploy đầu) → nói rõ "sẽ không có mỏ neo rollback".

> 📌 **Tóm gọn Step 1:** "Trước khi thay máu, hãy ghi nhớ trong đầu (biến `PRIOR_SHA`) là máu cũ thuộc nhóm nào — nhưng đừng vội ghi vào sổ (`.previous-sha`) cho đến khi chắc chắn máu mới khỏe."

### 5.4. STEP 2 — Đăng nhập Docker Hub (dòng 72–76)

```bash
echo "==> Logging in to Docker Hub..."
echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
```

- VPS cần đăng nhập Docker Hub để có quyền **kéo (pull)** image (nhất là khi repo image ở chế độ private).
- **`echo "${DOCKERHUB_TOKEN}" | docker login ... --password-stdin`** — đây là cách đăng nhập **an toàn**:
  - `echo` token rồi **dẫn (pipe `|`)** vào `docker login`.
  - **`--password-stdin`** = "đọc mật khẩu từ luồng vào chuẩn (stdin)" thay vì gõ trực tiếp trên dòng lệnh.
  - 👉 Vì sao không viết `docker login -p "$TOKEN"`? Vì mật khẩu gõ thẳng trên command line sẽ **lộ ra trong lịch sử lệnh và danh sách tiến trình (`ps`)**. Truyền qua stdin thì không lưu lại đâu cả → kín đáo hơn.
- Hai biến `DOCKERHUB_TOKEN` và `DOCKERHUB_USERNAME` đến từ đâu? Nhớ lại Job 3 đã dùng `envs: DOCKERHUB_TOKEN,DOCKERHUB_USERNAME` để **mang chúng qua phiên SSH** vào VPS. Chúng đang nằm sẵn trong môi trường của script.

---

### 5.5. STEP 3 — Kéo image mới về (dòng 78–84)

```bash
for SERVICE in $SERVICES; do
  echo "==> Pulling $REGISTRY/$SERVICE:$IMAGE_TAG"
  docker pull "$REGISTRY/$SERVICE:$IMAGE_TAG"
done
```

- Lặp qua từng service trong `$SERVICES` (`shopee-api`, `shopee-web`, `shopee-admin`).
- **`docker pull "$REGISTRY/$SERVICE:$IMAGE_TAG"`** = tải image đã build sẵn từ Docker Hub về VPS. Vd: `docker pull lehoangtrong/shopee-api:sha-418a594`.
- 👉 **Đây là lý do VPS không cần build:** mọi việc build nặng nề đã xong ở Job 2 trên GitHub. VPS chỉ "tải hàng đã đóng gói" về.
- Nhờ `set -e`, nếu một lệnh `docker pull` fail (vd tag không tồn tại, mất mạng) → script **dừng ngay** tại đó, không deploy tiếp với image thiếu.

> 💡 **Mẹo hiểu:** Tải **trước**, restart **sau**. Tách riêng bước pull giúp giảm thời gian "chết" (downtime): khi đến lúc restart thì image đã nằm sẵn trên đĩa, container mới khởi động gần như tức thì.

---

### 5.6. STEP 4 — Rolling update: restart từng service một (dòng 86–92)

```bash
for SERVICE in $SERVICES; do
  echo "==> Updating $SERVICE..."
  docker compose -f "$COMPOSE_FILE" up -d --no-deps --remove-orphans "$SERVICE"
done
```

Đây là bước **thay container cũ bằng container mới**. Phân tích kỹ lệnh `docker compose up`:

| Phần                                | Ý nghĩa                                                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker compose -f "$COMPOSE_FILE"` | Dùng đúng file `docker-compose.prod.yaml` làm bản thiết kế.                                                                                                                              |
| `up -d`                             | Khởi động service ở chế độ **nền (detached)**. Vì biến `REGISTRY` và `IMAGE_TAG` đã `export` ở mục 5.2, compose sẽ tạo container từ image **mới** `lehoangtrong/shopee-api:sha-418a594`. |
| `--no-deps`                         | **"Không động tới các service phụ thuộc."** Vd khi update `shopee-api`, **không** tự khởi động lại `mongodb`/`redis` mà nó depends_on. Tránh restart dây chuyền không cần thiết.         |
| `--remove-orphans`                  | Dọn các container "mồ côi" — tức container của service đã bị xóa khỏi file compose nhưng vẫn còn sót lại. Giữ môi trường sạch sẽ.                                                        |
| `"$SERVICE"`                        | Chỉ tác động đúng **một** service được nêu tên.                                                                                                                                          |

> 🔄 **Vì sao gọi là "rolling update" (cập nhật cuốn chiếu)?** Vì ta update **lần lượt từng service**, không phải tắt hết rồi bật lại cùng lúc. Khi `shopee-api` đang được thay, thì `shopee-web` và `shopee-admin` cũ vẫn còn chạy. Cách này giảm thiểu downtime so với việc `docker compose down` (tắt sạch) rồi `up` lại.
>
> ⚠️ **Lưu ý thực tế:** đây là rolling update "đơn giản" — vẫn có một khoảnh khắc ngắn service đang restart bị gián đoạn. Nó **không** phải zero-downtime kiểu blue-green (chạy song song 2 bản rồi mới chuyển traffic). Với dự án cá nhân, mức này là đủ và đơn giản để bảo trì.

### 5.7. STEP 5 — Health check & tự động rollback (dòng 94–145)

Đây là **bộ não an toàn** của script. Sau khi đã thay container, ta phải hỏi: **"Bản mới có thực sự sống không?"** Nếu không → tự động lùi về bản tốt.

```bash
echo "==> Running health checks for: $SERVICES"
if ! "$SCRIPT_DIR/health-check.sh" $SERVICES; then
  echo "ERROR: Health check failed after deploy." >&2
  ...
```

- **`"$SCRIPT_DIR/health-check.sh" $SERVICES`** — gọi script anh em `health-check.sh` (giải thích đầy đủ ở [mục 6](#6-phần-c--health-checksh-giải-thích-từng-dòng)), truyền danh sách 3 service. Script này thử gọi HTTP tới từng service, đợi tới khi nhận HTTP 200.
- **`if ! ...; then`** — dấu **`!`** đảo ngược kết quả. Đọc là: "**nếu health check KHÔNG thành công** thì chạy khối xử lý lỗi bên trong". (health-check trả về 0 = OK, ≠0 = fail; `!` biến fail thành "true" để vào nhánh xử lý.)

Bên trong nhánh "health check fail", script **không vội rollback bừa**. Nó có **3 lớp bảo vệ** trước khi quyết định:

```bash
  ROLLBACK_TARGET=""
  if [ -f "$PREVIOUS_SHA_FILE" ]; then
    ROLLBACK_TARGET=$(cat "$PREVIOUS_SHA_FILE" | tr -d '[:space:]')
  fi
```

- **`[ -f "$X" ]`** = "file X có tồn tại không". Nếu file `.previous-sha` có → đọc nội dung.
- **`cat ... | tr -d '[:space:]'`** — `cat` đọc file; **`tr -d '[:space:]'`** xóa **mọi ký tự khoảng trắng** (dấu cách, tab, xuống dòng). Mục đích: làm sạch để `ROLLBACK_TARGET` chỉ còn đúng chuỗi `sha-xxxxxxx`, không dính newline thừa.

#### 🛡️ Guard A — Không lùi về chính bản vừa hỏng (dòng 107–114)

```bash
  if [ -n "$ROLLBACK_TARGET" ] && [ "$ROLLBACK_TARGET" = "$IMAGE_TAG" ]; then
    echo "ERROR: Rollback target ($ROLLBACK_TARGET) is the same as the just-failed tag ($IMAGE_TAG)." >&2
    echo "       Aborting rollback — rolling back to this SHA would reproduce the same failure." >&2
    echo "       Manual intervention required: inspect logs and push a fixed image." >&2
    exit 1
  fi
```

- **Tình huống:** nếu "mỏ neo rollback" (`ROLLBACK_TARGET`) lại **trùng** với chính tag vừa deploy fail (`IMAGE_TAG`), thì lùi về nó chỉ **tái hiện đúng lỗi đó** → vòng lặp tử thần (death-loop).
- **`&&`** = "và". Điều kiện: mỏ neo không rỗng **và** mỏ neo == tag vừa fail → **`exit 1`** (bỏ cuộc sạch sẽ, yêu cầu can thiệp tay).

#### 🛡️ Guard B — Không lùi về bản đang "giãy chết" (dòng 116–131)

```bash
  if [ -n "$ROLLBACK_TARGET" ]; then
    LOOPING=$(docker ps --filter "status=restarting" --format "{{.Image}}" 2>/dev/null \
              | grep -oE 'sha-[a-f0-9]{7}' | sort -u || true)
    if echo "$LOOPING" | grep -qF "$ROLLBACK_TARGET"; then
      echo "ERROR: Rollback target ($ROLLBACK_TARGET) is currently crash-looping on the VPS." >&2
      ...
      exit 1
    fi
  fi
```

- **`docker ps --filter "status=restarting"`** = liệt kê các container đang ở trạng thái **"restarting"** (Docker tự khởi động lại liên tục vì chúng cứ crash). **`--format "{{.Image}}"`** chỉ in tên image.
- **`grep -oE 'sha-[a-f0-9]{7}' | sort -u`** — bóc SHA từ tên image, `sort -u` loại trùng (unique).
- **`echo "$LOOPING" | grep -qF "$ROLLBACK_TARGET"`** — **`grep -q`** = "im lặng, chỉ trả về kết quả có/không"; **`-F`** = so khớp **chuỗi cố định** (fixed string, không coi là regex). Nghĩa là: "trong danh sách container đang crash-loop, có chứa mỏ neo rollback không?".
- **Tình huống:** nếu bản ta định lùi về **đang tự crash liên tục** ngay trên VPS, thì nó là "bản nhiễm độc" (poisoned), lùi về cũng vô ích → **`exit 1`** kèm hướng dẫn xử lý tay 3 bước (xóa `.previous-sha`, `docker compose down`, push bản đã sửa).

#### 🛡️ Guard C — Không có mỏ neo nào để lùi (dòng 133–137)

```bash
  if [ -z "$ROLLBACK_TARGET" ]; then
    echo "ERROR: No previous SHA recorded. Cannot roll back — no known-good target." >&2
    echo "       Manual intervention required: push a fixed image to master." >&2
    exit 1
  fi
```

- Nếu `ROLLBACK_TARGET` rỗng (vd đây là lần deploy **đầu tiên**, chưa từng có bản healthy nào) → không có gì để lùi về → báo lỗi rõ ràng và **`exit 1`**.

#### ✅ Qua được cả 3 guard → mới thực sự rollback (dòng 139–144)

```bash
  echo "==> Triggering rollback to $ROLLBACK_TARGET..."
  export FAILED_TAG="$IMAGE_TAG"
  "$SCRIPT_DIR/rollback.sh"
  exit 1
fi
```

- **`export FAILED_TAG="$IMAGE_TAG"`** — truyền tag vừa-fail sang cho `rollback.sh` qua biến môi trường. Đây là **lớp bảo vệ kép**: `rollback.sh` sẽ tự kiểm tra lần nữa và **từ chối** nếu bị bảo lùi về đúng bản vừa hỏng (chi tiết ở [mục 7](#7-phần-d--rollbacksh-giải-thích-từng-dòng)).
- **`"$SCRIPT_DIR/rollback.sh"`** — gọi script rollback để khôi phục về `ROLLBACK_TARGET`.
- **`exit 1`** — sau khi rollback xong, script deploy vẫn thoát với mã **1 (thất bại)**. Vì sao? Vì lần **deploy bản mới đã FAIL** — dù đã cứu vãn bằng rollback, ta vẫn phải báo cho GitHub Actions biết "lần deploy này không thành công" để bạn nhận cảnh báo và đi sửa code.

> 🧭 **Sơ đồ quyết định khi health check FAIL:**
>
> ```
> Health check FAIL
>   │
>   ├─ Guard A: mỏ neo == tag vừa fail?      ─► CÓ ─► exit 1 (đừng lùi, sẽ lặp lỗi)
>   ├─ Guard B: mỏ neo đang crash-loop?      ─► CÓ ─► exit 1 (bản nhiễm độc)
>   ├─ Guard C: không có mỏ neo?             ─► CÓ ─► exit 1 (không có chỗ lùi)
>   └─ Qua hết 3 guard                        ─► rollback.sh ─► exit 1
> ```

### 5.8 — Health check QUA → ghi mỏ neo "đã xác nhận khỏe" (dòng 147–156)

```bash
if [ -n "$PRIOR_SHA" ]; then
  echo "$PRIOR_SHA" > "$PREVIOUS_SHA_FILE"
  echo "==> Persisted confirmed-healthy prior SHA: $PRIOR_SHA"
else
  echo "==> No prior SHA to record (first deploy or could not detect running image)."
fi
```

Nhớ lại ở [mục 5.3](#53--step-1--chụp-lại-sha-đang-chạy-trước-đó-dòng-4370): khi bắt đầu deploy, ta đã **chụp** SHA đang chạy vào biến `PRIOR_SHA` nhưng **CHƯA ghi ra đĩa**. Bây giờ mới là lúc ghi.

- **Vì sao đợi tới đây mới ghi?** Vì file `.previous-sha` là **mỏ neo rollback** — nó phải luôn trỏ về một bản **đã được xác nhận khỏe mạnh**. Nếu ghi ngay từ đầu, lỡ bản mới fail và bản cũ cũng đang lỗi, ta sẽ lùi về một mỏ neo không đáng tin. Ghi ở đây (sau khi health check của bản MỚI đã PASS) bảo đảm: tại thời điểm `PRIOR_SHA` được ghi làm mỏ neo, nó đúng là bản vừa-bị-thay-thế bởi một bản mới khỏe mạnh.
- **`echo "$PRIOR_SHA" > "$PREVIOUS_SHA_FILE"`** — ghi đè (dấu `>`) SHA cũ vào file `backups/.previous-sha`. Lần deploy SAU, nếu bản mới fail, `rollback.sh` sẽ đọc đúng giá trị này để biết lùi về đâu.
- **Nhánh `else`** — nếu `PRIOR_SHA` rỗng (lần deploy **đầu tiên**, hoặc không dò được image đang chạy) thì không ghi gì, chỉ in thông báo. Điều này hợp lý: deploy lần đầu thì làm gì có "bản trước" để lùi về.

> 💡 **Hiểu sâu — vì sao tách "chụp" và "ghi" làm 2 thời điểm?**
> Đây là mẫu thiết kế **"chỉ cam kết khi đã chắc chắn thành công"** (commit-on-success). `.previous-sha` không bao giờ chứa một SHA "vu vơ đang chạy" — nó chỉ chứa SHA mà ta **biết chắc** từng khỏe mạnh ngay trước lần thay thế thành công. Nhờ vậy đường rollback luôn an toàn.

### 5.9 — Dọn dẹp image cũ (prune) — dòng 158–200

Đây là bước cuối của `deploy.sh`. Sau khi deploy thành công và đã ghi mỏ neo, ta dọn các image SHA cũ để **VPS không bị đầy ổ đĩa**. Đây chính là phần được thêm ở commit gần nhất (`chore: add idempotent image pruning to deploy.sh to fix VPS disk-full deploys`).

#### Đọc lại mỏ neo để giữ lại (dòng 170–173)

```bash
KEEP_PREV=""
if [ -f "$PREVIOUS_SHA_FILE" ]; then
  KEEP_PREV="$(tr -d '[:space:]' < "$PREVIOUS_SHA_FILE")"
fi
```

- Mục tiêu: xác định **2 image cần GIỮ LẠI** — bản đang chạy (`$IMAGE_TAG`) và bản rollback (`$KEEP_PREV`). Mọi image SHA khác đều có thể xóa.
- **`KEEP_PREV="$(tr -d '[:space:]' < "$PREVIOUS_SHA_FILE")"`** — đọc nội dung file mỏ neo, `tr -d '[:space:]'` xóa mọi khoảng trắng/xuống dòng để được chuỗi SHA sạch. Dùng cú pháp `< file` (đọc trực tiếp từ file) thay vì `cat file |` cho gọn.
- Nếu file không tồn tại, `KEEP_PREV` để rỗng → chỉ giữ lại mỗi bản đang chạy.

#### Quét và xóa image SHA thừa (dòng 175–195)

```bash
for repo in shopee-api shopee-web shopee-admin; do
  candidates=$(docker images "$REGISTRY/$repo" --format '{{.Repository}}:{{.Tag}}' 2>/dev/null \
    | grep -E 'sha-[a-f0-9]{7}$' || true)

  for img in $candidates; do
    tag="${img##*:}"

    if [ "$tag" = "$IMAGE_TAG" ]; then
      continue
    fi
    if [ -n "$KEEP_PREV" ] && [ "$tag" = "$KEEP_PREV" ]; then
      continue
    fi

    echo "==> Removing stale image: $img"
    docker rmi "$img" || true
  done
done
```

Phân tích từng dòng:

| Dòng lệnh                                                             | Ý nghĩa                                                                                                                                   |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `for repo in shopee-api shopee-web shopee-admin`                      | Lặp qua cả 3 repo image.                                                                                                                  |
| `docker images "$REGISTRY/$repo" --format '{{.Repository}}:{{.Tag}}'` | Liệt kê **mọi image cục bộ** thuộc repo này, in ra dạng `user/shopee-api:sha-abc1234`.                                                    |
| `\| grep -E 'sha-[a-f0-9]{7}$'`                                       | Chỉ giữ những image có tag dạng `sha-XXXXXXX` (7 ký tự hex). Loại bỏ `:latest` và các tag khác → **không bao giờ đụng tới tag `latest`**. |
| `\|\| true`                                                           | Nếu `grep` không tìm thấy gì (exit code 1), `\|\| true` ép thành công để `set -e` không kill script.                                      |
| `tag="${img##*:}"`                                                    | Bóc tag: `${img##*:}` = "xóa phần dài nhất từ đầu tới dấu `:` cuối cùng" → còn lại đúng `sha-abc1234`.                                    |
| `if [ "$tag" = "$IMAGE_TAG" ]; then continue`                         | **Giữ lại bản đang chạy** — bỏ qua, không xóa.                                                                                            |
| `if [ -n "$KEEP_PREV" ] && [ "$tag" = "$KEEP_PREV" ]; then continue`  | **Giữ lại bản rollback** (nếu có mỏ neo).                                                                                                 |
| `docker rmi "$img" \|\| true`                                         | Xóa image. `\|\| true` để lỡ image đang được container khác dùng (không xóa được) thì cũng không làm chết script.                         |

#### Quét layer "mồ côi" (dòng 197–200)

```bash
docker image prune -f || true
echo "==> Deploy complete."
```

- **`docker image prune -f`** — xóa các **dangling image** (layer mồ côi, không còn tag nào trỏ tới, sinh ra trong quá trình build/pull). `-f` = không hỏi xác nhận.
- **`|| true`** — idempotent, không làm chết script nếu lỗi vặt.
- **`echo "==> Deploy complete."`** — dòng cuối cùng. Khi bạn thấy dòng này trong log SSH nghĩa là **toàn bộ deploy đã hoàn tất thành công**.

> ⚠️ **Cực kỳ quan trọng — những gì prune KHÔNG BAO GIỜ làm:**
>
> - **KHÔNG** dùng `docker system prune` (sẽ xóa cả network, build cache...).
> - **KHÔNG** dùng cờ `-a`/`--all` (sẽ xóa cả image đang dùng bởi container dừng).
> - **KHÔNG** dùng `--volumes` và **KHÔNG** dùng `docker volume prune`.
>
> Vì sao? Vì **volume chứa dữ liệu thật** (MongoDB data, Redis data, file upload của user). Một lệnh `--volumes` sai có thể **xóa sạch database**. Script cố tình chỉ đụng tới **image**, tuyệt đối tránh xa **volume**. Đây là nguyên tắc an toàn cốt lõi.

> 💡 **Vì sao prune đặt ở CUỐI, sau khi đã ghi mỏ neo?**
> Để chắc chắn không có image nào mà đường rollback cần lại bị xóa nhầm giữa chừng. Thứ tự là: deploy → health check PASS → ghi mỏ neo → mới prune (và prune vẫn chừa lại đúng bản rollback). An toàn tuyệt đối.

---

## 6. Phần C — health-check.sh giải thích từng dòng

`deploy.sh` gọi `health-check.sh` ở dòng 98 để quyết định deploy thành công hay phải rollback. Đây là "người gác cổng" cuối cùng.

### 6.1 — Cấu hình đầu file

```bash
SERVICES="${*:-shopee-api shopee-web shopee-admin}"
MAX_ATTEMPTS=30
SLEEP_SECONDS=5
```

- **`SERVICES="${*:-...}"`** — nhận danh sách service từ tham số. `${*:-mặc-định}` nghĩa là "nếu không truyền tham số nào thì dùng mặc định cả 3 service".
- **`MAX_ATTEMPTS=30`** — thử tối đa **30 lần** cho mỗi service.
- **`SLEEP_SECONDS=5`** — mỗi lần thử cách nhau **5 giây**.
- → Tổng thời gian chờ tối đa mỗi service = `30 × 5 = 150 giây (2.5 phút)`. Với 3 service là `~7.5 phút`. (Đây là lý do `command_timeout: 15m` trong pipeline được đặt rộng rãi để đủ biên an toàn.)

### 6.2 — Bản đồ URL kiểm tra của từng service

```bash
service_url() {
  case "$1" in
    shopee-api)   echo "http://127.0.0.1:8083/health" ;;
    shopee-web)   echo "http://127.0.0.1:8081/" ;;
    shopee-admin) echo "http://127.0.0.1:8082/" ;;
    *) echo "ERROR: unknown service '$1'" >&2; exit 1 ;;
  esac
}
```

- Hàm `service_url` nhận tên service, trả về **URL cần ping** để biết nó sống hay chết.
- **`shopee-api`** → gọi đúng endpoint `/health` (NestJS thường có route này trả 200 khi app sẵn sàng).
- **`shopee-web` / `shopee-admin`** → chỉ cần gọi trang gốc `/` (Nginx serve được trang chủ nghĩa là container sống).
- **`*)`** (mặc định) — nếu truyền tên service lạ → báo lỗi và `exit 1` ngay (chống gõ sai tên).
- Lưu ý các cổng `8083/8081/8082` khớp đúng với phần map cổng trong `docker-compose.prod.yaml` ([mục 8](#8-phần-e--docker-composeprodyaml)).

### 6.3 — Vòng lặp kiểm tra với retry

```bash
FAILED_SERVICES=()

for SERVICE in $SERVICES; do
  URL="$(service_url "$SERVICE")"
  echo "==> Checking $SERVICE at $URL"
  HEALTHY=false

  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
      echo "    [$attempt/$MAX_ATTEMPTS] $SERVICE → HTTP 200 ✓ healthy"
      HEALTHY=true
      break
    fi
    echo "    [$attempt/$MAX_ATTEMPTS] $SERVICE → HTTP $HTTP_STATUS, chờ ${SLEEP_SECONDS}s..."
    sleep "$SLEEP_SECONDS"
  done

  if [ "$HEALTHY" = false ]; then
    FAILED_SERVICES+=("$SERVICE")
  fi
done
```

| Dòng lệnh                                 | Ý nghĩa                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `FAILED_SERVICES=()`                      | Mảng rỗng để gom các service **fail**.                                                            |
| `for SERVICE in $SERVICES`                | Lặp qua từng service cần kiểm tra.                                                                |
| `for attempt in $(seq 1 "$MAX_ATTEMPTS")` | Vòng retry: thử lại tối đa 30 lần.                                                                |
| `curl -s -o /dev/null -w "%{http_code}"`  | Gọi URL, **chỉ lấy mã HTTP** (`-w "%{http_code}"`), vứt body đi (`-o /dev/null`), im lặng (`-s`). |
| `--max-time 5`                            | Mỗi lần gọi chờ tối đa 5 giây rồi bỏ (tránh treo vô hạn).                                         |
| `\|\| echo "000"`                         | Nếu `curl` lỗi (chưa kết nối được) thì trả `"000"` thay vì để trống.                              |
| `if [ "$HTTP_STATUS" = "200" ]`           | Chỉ **200** mới coi là khỏe → set `HEALTHY=true`, `break` thoát vòng retry.                       |
| `sleep "$SLEEP_SECONDS"`                  | Chưa khỏe → ngủ 5 giây rồi thử lại.                                                               |
| `FAILED_SERVICES+=("$SERVICE")`           | Hết 30 lần vẫn chưa 200 → ghi service này vào danh sách fail.                                     |

> 💡 **Vì sao phải retry 30 lần?** Container vừa khởi động cần thời gian để app "ấm máy" (kết nối DB, load config, mở port...). Nếu kiểm tra ngay lập tức sẽ thấy lỗi giả. Cơ chế retry cho app tới **2.5 phút** để sẵn sàng — đủ rộng rãi cho hầu hết app NestJS/Nginx.

### 6.4 — Kết luận khỏe/không khỏe

```bash
if [ "${#FAILED_SERVICES[@]}" -gt 0 ]; then
  echo "ERROR: The following services failed health check: ${FAILED_SERVICES[*]}" >&2
  exit 1
fi

echo "==> All services healthy."
exit 0
```

- **`${#FAILED_SERVICES[@]}`** — đếm số phần tử trong mảng fail. Nếu **> 0** → có ít nhất 1 service chết.
- Có service fail → in danh sách, **`exit 1`** (thất bại). Mã thoát 1 này chính là tín hiệu để `deploy.sh` kích hoạt rollback ([mục 5.7](#57--step-5--health-check--auto-rollback-dòng-94145)).
- Tất cả khỏe → **`exit 0`** (thành công), `deploy.sh` đi tiếp tới bước ghi mỏ neo + prune.

> 🧭 **health-check.sh quyết định toàn bộ số phận của lần deploy:**
>
> ```
> exit 0  ─►  deploy.sh: ghi mỏ neo + prune + "Deploy complete"  ✓
> exit 1  ─►  deploy.sh: chạy qua 3 guard → rollback.sh  ✗
> ```

---

## 7. Phần D — rollback.sh giải thích từng dòng

`rollback.sh` được `deploy.sh` gọi khi health check fail (và đã qua 3 guard). Nhiệm vụ: **đưa cả 3 service quay về bản SHA tốt trước đó**.

### 7.1 — Tính đường dẫn + registry

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PREVIOUS_SHA_FILE="$PROJECT_ROOT/backups/.previous-sha"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yaml"
REGISTRY="${REGISTRY:-${DOCKERHUB_USERNAME:-OWNER}}"
```

- 3 dòng đầu giống hệt `deploy.sh`: xác định thư mục script, gốc dự án, file mỏ neo, file compose.
- **`REGISTRY="${REGISTRY:-${DOCKERHUB_USERNAME:-OWNER}}"`** — lồng 2 lớp mặc định: ưu tiên biến `REGISTRY`, không có thì lấy `DOCKERHUB_USERNAME`, không có nữa thì dùng chuỗi `OWNER` (placeholder). Vì `rollback.sh` có thể được gọi **độc lập** (chạy tay), nên nó phải tự lo registry.

### 7.2 — Đọc mỏ neo + chuẩn hóa tag

```bash
if [ ! -f "$PREVIOUS_SHA_FILE" ]; then
  echo "ERROR: No previous SHA file found..." >&2
  exit 1
fi

PREV_SHA=$(cat "$PREVIOUS_SHA_FILE" | tr -d '[:space:]')

if [ -z "$PREV_SHA" ]; then
  echo "ERROR: Previous SHA file exists but is empty..." >&2
  exit 1
fi

if echo "$PREV_SHA" | grep -qE '^sha-[a-f0-9]{7}$'; then
  PREV_TAG="$PREV_SHA"
else
  PREV_TAG="sha-$(echo "$PREV_SHA" | cut -c1-7)"
fi
```

- **Kiểm tra file tồn tại** (`-f`) — không có → không biết lùi về đâu → `exit 1`.
- **`PREV_SHA=$(cat ... | tr -d '[:space:]')`** — đọc nội dung mỏ neo, xóa khoảng trắng.
- **Kiểm tra rỗng** (`-z`) — file rỗng cũng `exit 1`.
- **Chuẩn hóa tag:** nếu giá trị đã dạng `sha-abc1234` thì dùng nguyên; nếu chỉ là SHA thô thì gắn tiền tố `sha-` + lấy 7 ký tự đầu (`cut -c1-7`). Đảm bảo `PREV_TAG` luôn đúng định dạng tag image.

### 7.3 — Guard chống death-loop (dòng 68–74)

```bash
FAILED_TAG="${FAILED_TAG:-}"
if [ -n "$FAILED_TAG" ] && [ "$PREV_TAG" = "$FAILED_TAG" ]; then
  echo "ERROR: Rollback target ($PREV_TAG) equals the just-failed tag ($FAILED_TAG)." >&2
  exit 1
fi
```

- Đây là **lớp bảo vệ thứ hai** (lớp đầu nằm ở `deploy.sh` Guard A). `deploy.sh` đã `export FAILED_TAG="$IMAGE_TAG"` trước khi gọi rollback.
- Nếu mỏ neo trùng đúng tag vừa fail → lùi về cũng chỉ lặp lại lỗi → từ chối, `exit 1`.
- **Vì sao cần kiểm 2 lần?** Vì `rollback.sh` có thể chạy **độc lập** (không qua `deploy.sh`). Lớp guard riêng giúp nó tự bảo vệ trong mọi ngữ cảnh.

### 7.4 — Login Docker Hub (cho lần chạy độc lập)

```bash
if [ -n "${DOCKERHUB_USERNAME:-}" ] && [ -n "${DOCKERHUB_TOKEN:-}" ]; then
  echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
else
  echo "==> ...skipping login (assuming cached credentials or public images)."
fi
```

- Nếu có đủ user + token → login. Nếu không → bỏ qua (giả định đã login sẵn từ `deploy.sh`, hoặc image public).

### 7.5 — Kéo image bản cũ

```bash
for SERVICE in shopee-api shopee-web shopee-admin; do
  echo "==> Pulling $REGISTRY/$SERVICE:$PREV_TAG"
  docker pull "$REGISTRY/$SERVICE:$PREV_TAG"
done

export REGISTRY
export IMAGE_TAG="$PREV_TAG"
```

- Kéo image của **bản cũ tốt** cho cả 3 service.
- **`export IMAGE_TAG="$PREV_TAG"`** — đặt biến để `docker compose` thay vào `image: ${REGISTRY}/...:${IMAGE_TAG}`, khiến compose dùng đúng tag cũ.

### 7.6 — Khởi động lại, bỏ qua service đã đúng bản

```bash
SERVICES_TO_RESTART=""
for SERVICE in shopee-api shopee-web shopee-admin; do
  CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q "$SERVICE" 2>/dev/null | head -1 || true)
  CURRENT_TAG=""
  if [ -n "$CONTAINER_ID" ]; then
    RUNNING_IMAGE=$(docker inspect --format '{{.Config.Image}}' "$CONTAINER_ID" 2>/dev/null || true)
    CURRENT_TAG=$(echo "$RUNNING_IMAGE" | grep -oE 'sha-[a-f0-9]{7}' | head -1 || true)
  fi
  if [ "$CURRENT_TAG" = "$PREV_TAG" ]; then
    echo "==> $SERVICE is already on $PREV_TAG — skipping recreation."
  else
    SERVICES_TO_RESTART="$SERVICES_TO_RESTART $SERVICE"
  fi
done

if [ -n "$SERVICES_TO_RESTART" ]; then
  docker compose -f "$COMPOSE_FILE" up -d --no-deps $SERVICES_TO_RESTART
else
  echo "==> All services are already on $PREV_TAG — no containers recreated."
fi
```

- Với mỗi service: dò **tag đang chạy** (`CURRENT_TAG`) bằng `docker inspect` + `grep`.
- **Nếu đã đúng `PREV_TAG`** → bỏ qua, không recreate (tránh downtime thừa). Ví dụ: chỉ `shopee-api` hỏng, thì `web`/`admin` đang chạy bản cũ vẫn ổn → chỉ cần lùi mỗi `api`.
- **Chỉ recreate những service thực sự cần** bằng một lệnh `docker compose up -d --no-deps`.

> 💡 **Tối ưu hay:** rollback không "đập đi xây lại" cả 3 service một cách mù quáng. Nó chỉ động vào service nào đang lệch bản → giảm downtime tối đa.

### 7.7 — Health check lại để xác nhận rollback

```bash
if ! "$SCRIPT_DIR/health-check.sh" shopee-api shopee-web shopee-admin; then
  echo "ERROR: Health check failed after rollback. Manual intervention required." >&2
  exit 1
fi
echo "==> Rollback complete. Services restored to $PREV_TAG."
```

- Sau khi lùi bản, chạy lại `health-check.sh` để **xác nhận bản cũ thật sự khỏe**.
- Nếu ngay cả bản cũ cũng fail → tình huống xấu nhất, cần can thiệp tay → `exit 1`.
- Nếu khỏe → in `Rollback complete`. Hệ thống đã trở về trạng thái ổn định.

---

## 8. Phần E — docker-compose.prod.yaml

File này định nghĩa **stack production**: chạy cái gì, cổng nào, dữ liệu lưu ở đâu. `deploy.sh` và `rollback.sh` đều dùng nó (`docker compose -f docker-compose.prod.yaml`).

### 8.1 — Hai chế độ: Cloud vs Self-hosted (profiles)

```yaml
mongodb:
  image: mongo:7
  profiles: [self-hosted]
  command: ['mongod', '--replSet', 'rs0', '--bind_ip_all']
  ...
redis:
  image: redis:7-alpine
  profiles: [self-hosted]
  ...
```

- MongoDB và Redis được gắn **`profiles: [self-hosted]`**. Nghĩa là chúng **chỉ chạy** khi bạn thêm cờ `--profile self-hosted`.
- → Có **2 chế độ vận hành:**

| Chế độ               | Lệnh                                               | DB/Redis dùng từ đâu                                                                                       |
| -------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Cloud** (mặc định) | `docker compose -f docker-compose.prod.yaml up -d` | DB & Redis trên cloud (MongoDB Atlas, Redis Cloud...) — khai trong `.env.prod` qua `MONGO_URI`/`REDIS_URL` |
| **Self-hosted**      | `... --profile self-hosted up -d`                  | MongoDB + Redis chạy ngay trong Docker trên VPS                                                            |

- `deploy.sh` không thêm `--profile self-hosted` → mặc định chạy **chế độ cloud** (DB/Redis ở ngoài).

### 8.2 — Service shopee-api

```yaml
shopee-api:
  image: ${REGISTRY:-myuser}/shopee-api:${IMAGE_TAG:-latest}
  env_file: [.env.prod]
  volumes: ['./upload:/app/upload']
  ports: ['127.0.0.1:8083:4000']
  depends_on:
    mongodb: { condition: service_healthy, required: false }
    redis: { condition: service_healthy, required: false }
  healthcheck:
    test: ['CMD', 'wget', '-qO-', 'http://localhost:4000/health']
```

| Trường                                                       | Ý nghĩa                                                                                                                                                                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `image: ${REGISTRY:-myuser}/shopee-api:${IMAGE_TAG:-latest}` | Chính 2 biến mà `deploy.sh` `export` (REGISTRY + IMAGE_TAG) được thay vào đây. Nếu không set → mặc định `myuser/...:latest`.                                                                                     |
| `env_file: [.env.prod]`                                      | Nạp biến môi trường thật (MONGO_URI, REDIS_URL, JWT secret...) từ file `.env.prod` trên VPS.                                                                                                                     |
| `volumes: ['./upload:/app/upload']`                          | Bind mount thư mục `./upload` trên VPS vào `/app/upload` trong container. Ảnh upload được scp/rsync trực tiếp lên VPS và lập tức visible cho container. **Yêu cầu một lần duy nhất trên VPS:** `chown -R 1001:1001 ./upload` (container chạy với uid 1001 appuser).                                          |
| `ports: ['127.0.0.1:8083:4000']`                             | Map cổng 4000 (trong container) ra `127.0.0.1:8083` (trên VPS). Bind `127.0.0.1` → chỉ truy cập nội bộ, không lộ ra Internet.                                                                                    |
| `depends_on ... required: false`                             | "Nếu mongodb/redis CÓ chạy (chế độ self-hosted) thì đợi chúng healthy rồi mới khởi động api; nếu KHÔNG có (chế độ cloud) thì cứ chạy". `required: false` chính là chìa khóa cho cả 2 chế độ dùng chung một file. |
| `healthcheck: wget .../health`                               | Docker tự kiểm tra sức khỏe container bằng cách gọi `/health`.                                                                                                                                                   |

### 8.3 — Service shopee-web & shopee-admin

```yaml
shopee-web:
  image: ${REGISTRY:-myuser}/shopee-web:${IMAGE_TAG:-latest}
  ports: ['127.0.0.1:8081:8080']
  healthcheck:
    test: ['CMD', 'wget', '-qO-', 'http://localhost:8080/']

shopee-admin:
  image: ${REGISTRY:-myuser}/shopee-admin:${IMAGE_TAG:-latest}
  ports: ['127.0.0.1:8082:8080']
```

- Cả hai là **app React build bằng Vite**, được **Nginx** serve tĩnh trong container (cổng nội bộ 8080).
- `web` map ra `127.0.0.1:8081`, `admin` ra `127.0.0.1:8082` — khớp với URL trong `health-check.sh`.
- **Điểm mấu chốt về biến VITE\_\*:** các biến như `VITE_API_BASE_URL` được truyền vào **lúc BUILD image** (build-args trong pipeline), **không phải lúc chạy**. Vite "nướng cứng" (inline) các giá trị này thẳng vào file JS. Đây là lý do quan trọng giải thích cảnh báo trong log ở [mục 9](#9-đối-chiếu-với-log-thực-tế-của-bạn).

### 8.4 — Network & Volumes

```yaml
networks:
  shopee-network: { driver: bridge }
volumes:
  shopee_mongodb_data:
  shopee_redis_data:
```

- **`shopee-network`** (bridge) — mạng nội bộ để 3 service gọi nhau bằng tên (vd api gọi `mongodb:27017`).
- **2 volume** — nơi lưu dữ liệu bền vững (chỉ dùng ở chế độ self-hosted):
  - `shopee_mongodb_data` — dữ liệu MongoDB (chỉ dùng ở chế độ self-hosted).
  - `shopee_redis_data` — dữ liệu Redis (chỉ self-hosted).
- **File upload ảnh sản phẩm** sử dụng bind mount `./upload:/app/upload` thay vì named volume. Ảnh được vận chuyển lên VPS bằng scp/rsync, không qua git. **Yêu cầu một lần:** `chown -R 1001:1001 ./upload` trên VPS (container chạy với uid 1001 appuser).
- **Vì sao prune ở `deploy.sh` tránh xa volume:** chính 2 volume này chứa **dữ liệu không thể tái tạo**. Đó là lý do bước dọn dẹp tuyệt đối không bao giờ đụng `--volumes`.

---

## 9. Đối Chiếu Với Log Thực Tế Của Bạn

Khi xem log của lần deploy thành công (ảnh chụp pipeline bạn gửi), bạn sẽ thấy một số dòng cảnh báo. Mục này giải thích chúng **vô hại** và khớp đúng với những gì code làm.

### 9.1 — Cảnh báo `The "VITE_..." variable is not set`

Trong log build web/admin, bạn có thể thấy:

```
WARN[0000] The "VITE_API_BASE_URL" variable is not set. Defaulting to a blank string.
WARN[0000] The "VITE_SOCKET_URL" variable is not set. Defaulting to a blank string.
...
```

**Đây KHÔNG phải lỗi.** Giải thích:

- Các biến `VITE_*` được truyền qua **build-args lúc build image** trên GitHub Actions (xem [Job 2](#job-2-build--push-3-docker-images)), và đã được Vite **nướng cứng vào file JS** ngay tại bước build đó.
- Khi `docker compose` trên VPS đọc file compose, nó thấy phần `build.args` có tham chiếu `${VITE_...}` nhưng trên VPS **không có** các biến này (vì chúng chỉ cần lúc build, không cần lúc chạy) → Docker Compose in cảnh báo "variable not set, defaulting to blank".
- **Vì sao vô hại?** Vì trên VPS ta **không build lại** — ta chỉ `pull` image đã build sẵn rồi `up`. Phần `build.args` hoàn toàn bị bỏ qua khi đã có sẵn image. Giá trị thật đã nằm trong JS từ lúc build trên Actions rồi.

> 💡 **Tóm gọn:** cảnh báo VITE\_\* xuất hiện vì compose file có khai `build.args` nhưng VPS chạy ở chế độ "chỉ pull, không build". Giá trị đúng đã được inline vào bundle từ trước. **Bỏ qua an toàn.**

### 9.2 — Các mốc log nên thấy khi deploy THÀNH CÔNG

Đối chiếu log SSH với code `deploy.sh`, một lần deploy khỏe mạnh sẽ in các mốc theo đúng thứ tự:

```
==> Deploy started: registry=... tag=sha-xxxxxxx services=shopee-api shopee-web shopee-admin
==> Captured prior running SHA: sha-yyyyyyy (will persist only after health check passes)
==> Logging in to Docker Hub...
==> Pulling .../shopee-api:sha-xxxxxxx        (×3 service)
==> Updating shopee-api...                    (×3 service)
==> Running health checks for: ...
    [n/30] shopee-api → HTTP 200 ✓ healthy    (×3 service)
==> All services healthy.
==> Persisted confirmed-healthy prior SHA: sha-yyyyyyy
==> Pruning stale SHA-tagged images ...
==> Removing stale image: ...                 (nếu có image cũ)
==> Deploy complete.                          ◄── thấy dòng này = XONG
```

- Thấy **`==> Deploy complete.`** ở cuối = mọi thứ thành công trọn vẹn.
- Nếu health check fail, thay vì các dòng cuối bạn sẽ thấy `ERROR: Health check failed...` rồi `==> Triggering rollback...` (hoặc thông báo của một trong 3 guard).

### 9.3 — Đối chiếu nhanh: log nói gì ↔ code dòng nào

| Dòng log                                | Sinh ra từ           | Mục giải thích                                                        |
| --------------------------------------- | -------------------- | --------------------------------------------------------------------- |
| `Deploy started: ...`                   | `deploy.sh` dòng 41  | [5.2](#52--tính-đường-dẫn--export-biến-dòng-3039)                     |
| `Captured prior running SHA`            | `deploy.sh` dòng 67  | [5.3](#53--step-1--chụp-lại-sha-đang-chạy-trước-đó-dòng-4370)         |
| `Logging in to Docker Hub`              | `deploy.sh` dòng 75  | [5.4](#54--step-2--đăng-nhập-docker-hub-dòng-7276)                    |
| `Pulling .../sha-xxx`                   | `deploy.sh` dòng 82  | [5.5](#55--step-3--kéo-image-mới-về-vps-dòng-7884)                    |
| `Updating <service>...`                 | `deploy.sh` dòng 90  | [5.6](#56--step-4--rolling-update-cập-nhật-từng-service-dòng-8692)    |
| `[n/30] ... HTTP 200 ✓`                 | `health-check.sh`    | [6.3](#63--vòng-lặp-kiểm-tra-với-retry)                               |
| `Persisted confirmed-healthy prior SHA` | `deploy.sh` dòng 153 | [5.8](#58--health-check-qua--ghi-mỏ-neo-đã-xác-nhận-khỏe-dòng-147156) |
| `Removing stale image`                  | `deploy.sh` dòng 192 | [5.9](#59--dọn-dẹp-image-cũ-prune--dòng-158200)                       |
| `Deploy complete.`                      | `deploy.sh` dòng 200 | [5.9](#59--dọn-dẹp-image-cũ-prune--dòng-158200)                       |

---

## 10. Bảng Tra Cứu Nhanh (Cheat Sheet)

### 10.1 — Cú pháp bash hay gặp trong các script

| Cú pháp                       | Nghĩa                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `set -euo pipefail`           | Dừng ngay khi có lỗi (`-e`), báo lỗi biến chưa khai (`-u`), bắt lỗi giữa pipe (`-o pipefail`). |
| `${1:-}`                      | Tham số thứ 1, mặc định chuỗi rỗng nếu không truyền.                                           |
| `${VAR:-mặc-định}`            | Giá trị `VAR`, nếu rỗng thì dùng "mặc-định".                                                   |
| `${*}` / `$*`                 | Tất cả tham số còn lại, gộp thành chuỗi.                                                       |
| `${img##*:}`                  | Xóa phần dài nhất từ đầu tới `:` cuối → lấy phần sau dấu `:` cuối.                             |
| `[ -z "$x" ]` / `[ -n "$x" ]` | Chuỗi rỗng / chuỗi KHÔNG rỗng.                                                                 |
| `[ -f "$x" ]`                 | File tồn tại.                                                                                  |
| `cmd \|\| true`               | Chạy `cmd`, nếu fail vẫn coi như OK (chống `set -e` kill script).                              |
| `cmd >&2`                     | In ra **stderr** (luồng lỗi) thay vì stdout.                                                   |
| `tr -d '[:space:]'`           | Xóa mọi khoảng trắng/xuống dòng.                                                               |
| `grep -oE 'sha-[a-f0-9]{7}'`  | Trích đúng chuỗi `sha-` + 7 ký tự hex.                                                         |
| `grep -qF "x"`                | So khớp chuỗi cố định, im lặng (chỉ trả có/không).                                             |

### 10.2 — Lệnh Docker hay gặp

| Lệnh                                                     | Nghĩa                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `docker login -u USER --password-stdin`                  | Đăng nhập, đọc mật khẩu từ stdin (an toàn, không lộ trong log/history). |
| `docker pull REPO:TAG`                                   | Kéo image từ registry về máy.                                           |
| `docker compose up -d --no-deps SERVICE`                 | Tạo/khởi động service ở chế độ nền, **không** đụng service phụ thuộc.   |
| `--remove-orphans`                                       | Xóa container "mồ côi" không còn trong compose file.                    |
| `docker compose ps -q SERVICE`                           | Lấy ID container của 1 service.                                         |
| `docker inspect --format '{{.Config.Image}}' ID`         | Lấy tên image của container.                                            |
| `docker images REPO --format '{{.Repository}}:{{.Tag}}'` | Liệt kê image cục bộ theo định dạng tùy chọn.                           |
| `docker rmi IMG`                                         | Xóa 1 image.                                                            |
| `docker image prune -f`                                  | Xóa các layer dangling (mồ côi), không hỏi.                             |
| `docker ps --filter "status=restarting"`                 | Liệt kê container đang crash-loop.                                      |

### 10.3 — Lệnh xử lý sự cố trên VPS (chạy tay)

```bash
cd "$HOME/shopee-project"

# Xem trạng thái 3 service
docker compose -f docker-compose.prod.yaml ps

# Xem log 1 service (vd api), 100 dòng cuối, theo dõi realtime
docker compose -f docker-compose.prod.yaml logs -f --tail=100 shopee-api

# Xem mỏ neo rollback hiện tại
cat backups/.previous-sha

# Rollback thủ công về bản tốt trước đó
DOCKERHUB_USERNAME=... DOCKERHUB_TOKEN=... ./scripts/rollback.sh

# Health check thủ công
./scripts/health-check.sh shopee-api shopee-web shopee-admin
```

> ⚠️ **Tránh xa** `docker system prune -a --volumes` trên VPS production — nó có thể xóa dữ liệu thật (DB, file upload).

---

## 11. Câu Hỏi Thường Gặp (FAQ)

**Hỏi: Vì sao tag image dùng SHA commit chứ không dùng `latest`?**
Đáp: SHA là **bất biến** — mỗi commit ra đúng một image, không bao giờ ghi đè. Nhờ vậy rollback luôn trỏ chính xác về một phiên bản code cụ thể. `latest` thì "trôi" theo lần build mới nhất, không dùng để rollback an toàn được. (Pipeline vẫn gắn thêm tag `latest` cho tiện, nhưng cơ chế deploy/rollback chỉ dựa vào SHA.)

**Hỏi: VPS có build lại code không?**
Đáp: **Không.** Việc build nặng nề (compile TypeScript, build React) xảy ra trên GitHub Actions runner. VPS chỉ `docker pull` image đã build sẵn rồi `up`. Điều này giúp VPS nhẹ tải và deploy nhanh.

**Hỏi: "Rolling update" ở đây có phải zero-downtime không?**
Đáp: **Không hẳn.** Script restart **tuần tự từng service** (`--no-deps`), nên trong vài giây container được tái tạo, service đó có thể gián đoạn ngắn. Đây là rolling update đơn giản, **không phải** blue-green hay zero-downtime thực thụ. Với dự án cá nhân thì chấp nhận được.

**Hỏi: Nếu cả bản mới LẪN bản cũ đều hỏng thì sao?**
Đáp: 3 guard trong `deploy.sh` sẽ **từ chối rollback** (để khỏi lặp lỗi vô tận) và in hướng dẫn can thiệp tay: kiểm tra log, xóa `.previous-sha` nếu cần, rồi push một image đã sửa lên `master`.

**Hỏi: File `.previous-sha` bị mất thì sao?**
Đáp: Lần deploy kế tiếp nếu fail sẽ không có mỏ neo để lùi → Guard C kích hoạt, báo lỗi yêu cầu can thiệp tay. Lần deploy thành công kế tiếp sẽ tự ghi lại mỏ neo mới. Không gây mất dữ liệu, chỉ mất khả năng auto-rollback cho đúng lần đó.

**Hỏi: Cảnh báo `VITE_... variable is not set` có nguy hiểm không?**
Đáp: **Không.** Giá trị VITE\_\* đã được nướng cứng vào bundle JS từ lúc build trên Actions. Trên VPS chỉ pull-và-chạy nên không cần các biến đó. Xem chi tiết [mục 9.1](#91--cảnh-báo-the-vite-variable-is-not-set).

**Hỏi: Vì sao bước prune đặt ở cuối, sau khi ghi mỏ neo?**
Đáp: Để bảo đảm không xóa nhầm image mà đường rollback cần. Trình tự an toàn: deploy → health PASS → ghi mỏ neo → prune (và prune luôn chừa lại bản đang chạy + bản rollback).

**Hỏi: Vì sao 3 service đều bind `127.0.0.1`?**
Đáp: Để **không lộ trực tiếp ra Internet**. Một reverse proxy (Nginx host) đứng trước, nhận request công khai rồi chuyển vào các cổng nội bộ này. Đây là lớp bảo mật cơ bản.

**Hỏi: Làm sao chạy kèm MongoDB/Redis ngay trên VPS?**
Đáp: Dùng `--profile self-hosted` khi `up`. Khi đó 2 service `mongodb`/`redis` mới khởi động, và `depends_on ... required: false` khiến api đợi chúng healthy. Mặc định (không profile) là chế độ cloud, DB/Redis lấy từ dịch vụ ngoài qua `.env.prod`.

---

> **Kết:** Toàn bộ flow đúng với triết lý ở đầu dự án — _一度正しく、永遠に動く (làm đúng một lần, chạy mãi mãi)_: build một lần trên CI, tag bất biến theo SHA, deploy có health check, fail thì tự rollback an toàn nhờ 3 lớp guard, và dọn dẹp ổ đĩa mà tuyệt đối không đụng tới dữ liệu. Nắm chắc tài liệu này là bạn hiểu trọn vẹn con đường code đi từ `git push` tới lúc chạy trên VPS.
