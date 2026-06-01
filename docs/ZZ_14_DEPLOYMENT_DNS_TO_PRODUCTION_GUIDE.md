# HƯỚNG DẪN DEPLOYMENT: DNS ĐẾN PRODUCTION

> **Hướng dẫn từng bước triển khai shopee-project lên server production — từ cấu hình DNS, cài đặt server, build ứng dụng, đến cấu hình reverse proxy với Caddy/Nginx. Dành cho developer mới lần đầu deploy.**
>
> **Ngày tạo:** 30/05/2026
> **Phiên bản:** 1.1 (cập nhật 01/06/2026 — bổ sung Section 14: So sánh Static SPA vs NextJS SSR)

---

## MỤC LỤC

1. [Tổng quan kiến trúc deployment](#1-tong-quan-kien-truc-deployment)
2. [Bước 1 — Cấu hình DNS](#2-buoc-1-cau-hinh-dns)
3. [Bước 2 — Chuẩn bị Server](#3-buoc-2-chuan-bi-server)
4. [Bước 3 — Backing Services (Docker)](#4-buoc-3-backing-services)
5. [Bước 4 — Cấu hình & Build shopee-api](#5-buoc-4-shopee-api)
6. [Bước 5 — Đổi domain shop → shopee (6 chỗ hard-code)](#6-buoc-5-doi-domain)
7. [Bước 6 — Build shopee-web](#7-buoc-6-build-shopee-web)
8. [Bước 7 — Build shopee-admin](#8-buoc-7-build-shopee-admin)
9. [Bước 8 — Reverse Proxy với Caddy](#9-buoc-8-caddy)
10. [Bước 8b — Nginx (phương án thay thế)](#10-buoc-8b-nginx)
11. [Bước 9 — Kiểm tra end-to-end](#11-buoc-9-kiem-tra)
12. [Phụ lục — Bảng tổng hợp & Troubleshooting](#12-phu-luc)
13. [Triển khai chung VPS với project khác (twitter-api)](#13-trien-khai-chung-vps)
14. [So sánh deploy: Static SPA vs NextJS SSR](#14-so-sanh-static-vs-ssr)

---

## 1. Tổng quan kiến trúc deployment

Trước khi bắt tay vào từng bước, hãy nhìn toàn cảnh hệ thống để hiểu **cái gì chạy ở đâu** và **tại sao**.

### 1.1 Sơ đồ kiến trúc tổng thể

```
+------------------+
|    Internet      |
|  (trinh duyet,   |
|   mobile app)    |
+--------+---------+
         |
         | DNS lookup: ten mien -> IP
         v
+--------------------------------------------------+
|              DNS Provider                        |
|  shopee.lehoangtrong.com       A -> 103.106.104.37 |
|  shopee-admin.lehoangtrong.com A -> 103.106.104.37 |
|  api-ecom.lehoangtrong.com     A -> 103.106.104.37 |
+--------+-----------------------------------------+
         |
         | HTTP/HTTPS port 80/443
         v
+------------------------------------------+
|         Server: 103.106.104.37           |
|                                          |
|  +------------------------------------+  |
|  |   Reverse Proxy (Caddy / Nginx)    |  |
|  |  Phan luong theo HTTP Host header  |  |
|  |                                    |  |
|  |  shopee.*       -> /dist/web/      |  |
|  |  shopee-admin.* -> /dist/admin/    |  |
|  |  api-ecom.*     -> localhost:4000  |  |
|  +----+----------+----------+---------+  |
|       |          |          |            |
|       v          v          v            |
|  +---------+ +-------+ +----------+     |
|  | Static  | |Static | | Node.js  |     |
|  | Files   | |Files  | | Process  |     |
|  | shopee- | |shopee-| | shopee-  |     |
|  | web/dist| |admin/ | | api:4000 |     |
|  |         | |dist   | | (PM2)    |     |
|  +---------+ +-------+ +----+-----+     |
|                              |           |
|  +---------------------------v---------+ |
|  |     Backing Services (Docker)       | |
|  |  +----------+  +-------------+     | |
|  |  | MongoDB  |  | Meilisearch |     | |
|  |  | :27017   |  | :7700       |     | |
|  |  | (Docker) |  | (Docker)    |     | |
|  |  +----------+  +-------------+     | |
|  |                                     | |
|  |  Redis Cloud (external, internet)   | |
|  +-------------------------------------+ |
+------------------------------------------+

+------------------------------------------+
|  shopee-app (React Native mobile)        |
|  OUT OF SCOPE cho DNS/web deployment     |
|  Goi API qua: api-ecom.lehoangtrong.com  |
+------------------------------------------+
```

### 1.2 Ba ứng dụng web và vai trò của chúng

| Ứng dụng | Subdomain | Loại | Cách chạy trên server |
|----------|-----------|------|-----------------------|
| shopee-web | shopee.lehoangtrong.com | Vite SPA (storefront) | Static files — web server phục vụ |
| shopee-admin | shopee-admin.lehoangtrong.com | Vite SPA (admin panel) | Static files — web server phục vụ |
| shopee-api | api-ecom.lehoangtrong.com | Node/Express 5 + Socket.IO | Live process — PM2 giữ sống |

**Điểm quan trọng cho người mới:** Sau khi `build`, shopee-web và shopee-admin chỉ là các file HTML/CSS/JS tĩnh. Web server (Caddy hoặc Nginx) đọc và trả về các file đó — không có process Node nào chạy cho chúng. Ngược lại, shopee-api là một process Node thực sự, phải được giữ sống liên tục bằng PM2.

### 1.3 Tại sao 3 subdomain dùng chung 1 IP?

DNS chỉ ánh xạ tên miền → địa chỉ IP. Khi trình duyệt kết nối đến `103.106.104.37`, nó gửi kèm HTTP header `Host: shopee.lehoangtrong.com`. Reverse proxy đọc header đó và quyết định chuyển request đến đâu. Đây là lý do tại sao nhiều tên miền/subdomain có thể trỏ về cùng một IP — reverse proxy phân luồng dựa trên `Host` header, không phải IP.

---

## 2. Bước 1 — Cấu hình DNS

### 2.1 DNS là gì và tại sao cần cấu hình?

DNS (Domain Name System) là "danh bạ điện thoại" của internet — nó dịch tên miền dễ nhớ (như `shopee.lehoangtrong.com`) thành địa chỉ IP mà máy tính hiểu được (`103.106.104.37`). Không có DNS, người dùng phải nhớ địa chỉ IP thay vì tên miền.

### 2.2 Giải thích các loại record DNS

| Ký hiệu | Tên đầy đủ | Ý nghĩa |
|---------|-----------|---------|
| `@` | Apex / naked domain | Chính là `lehoangtrong.com` (không có subdomain). **Phải là A record** — không thể là CNAME theo chuẩn DNS. |
| `www` | Subdomain www | `www.lehoangtrong.com` — thường là CNAME trỏ về `@` để theo apex. |
| `api-ecom` | Subdomain tùy chỉnh | `api-ecom.lehoangtrong.com` — trỏ thẳng về IP bằng A record. |
| `shopee` | Subdomain mới | `shopee.lehoangtrong.com` — cần thêm mới. |
| `shopee-admin` | Subdomain mới | `shopee-admin.lehoangtrong.com` — cần thêm mới. |

**Tại sao `@` phải là A record?** Theo chuẩn DNS (RFC 1034), CNAME không được phép ở apex domain vì apex còn chứa SOA và NS records. Nếu dùng CNAME ở `@`, nhiều DNS resolver sẽ từ chối hoặc hoạt động không ổn định.

### 2.3 Các DNS record hiện có

Đây là trạng thái DNS hiện tại của domain `lehoangtrong.com`:

| Tên (Name) | Loại (Type) | Giá trị (Value) | Ghi chú |
|------------|-------------|-----------------|---------|
| `@` | A | `103.106.104.37` | Apex domain — lehoangtrong.com |
| `www` | CNAME | `lehoangtrong.com` | Alias của apex |
| `api-ecom` | A | `103.106.104.37` | Backend API |
| `www.api-ecom` | A | `103.106.104.37` | Alias www cho API |

### 2.4 Các DNS record cần THÊM MỚI

Thêm 2 record sau vào DNS provider của bạn:

| Tên (Name) | Loại (Type) | Giá trị (Value) | TTL |
|------------|-------------|-----------------|-----|
| `shopee` | A | `103.106.104.37` | 3600 (hoặc Auto) |
| `shopee-admin` | A | `103.106.104.37` | 3600 (hoặc Auto) |

Sau khi thêm, DNS sẽ có trạng thái cuối:

```
+--------------------------------------------------+
|  lehoangtrong.com -- DNS Records (trang thai cuoi)|
+--------------------------------------------------+
|  @              A     -> 103.106.104.37           |
|  www            CNAME -> lehoangtrong.com         |
|  api-ecom       A     -> 103.106.104.37           |
|  www.api-ecom   A     -> 103.106.104.37           |
|  shopee         A     -> 103.106.104.37  [MOI]    |
|  shopee-admin   A     -> 103.106.104.37  [MOI]    |
+--------------------------------------------------+
```

### 2.5 Kiểm tra DNS đã propagate chưa

DNS thay đổi cần thời gian để lan truyền (propagate) — thường từ vài phút đến 48 giờ tùy TTL. Kiểm tra bằng lệnh:

```bash
# Kiem tra shopee subdomain
nslookup shopee.lehoangtrong.com

# Kiem tra shopee-admin subdomain
nslookup shopee-admin.lehoangtrong.com

# Ket qua mong doi: Address: 103.106.104.37
```

Hoặc dùng công cụ online: https://dnschecker.org

---

## 3. Bước 2 — Chuẩn bị Server

### 3.1 Cài đặt các package cần thiết

Đăng nhập vào server qua SSH, sau đó cài đặt các công cụ cần thiết:

```bash
# Cap nhat package list
sudo apt update && sudo apt upgrade -y

# Cai dat cac cong cu co ban
sudo apt install -y curl git build-essential

# Cai dat Node.js 22 (dung NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Kiem tra phien ban
node --version   # v22.x.x
npm --version

# Cai dat pnpm 10.12.1 (phien ban dung trong monorepo)
npm install -g pnpm@10.12.1
pnpm --version   # 10.12.1

# Cai dat PM2 (process manager cho Node.js)
npm install -g pm2

# Cai dat Docker va Docker Compose
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
# Dang xuat va dang nhap lai de ap dung group docker
```

### 3.2 Cài đặt Caddy (reverse proxy)

```bash
# Cai dat Caddy tren Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Kiem tra Caddy da chay chua
sudo systemctl status caddy
```

### 3.3 Cấu hình Firewall

**Nguyên tắc bảo mật quan trọng:** Chỉ mở port 80 và 443 ra internet. Các port nội bộ (4000, 27017, 7700) phải được giữ trong localhost — không bao giờ expose ra ngoài.

```bash
# Dung ufw (Uncomplicated Firewall)
sudo ufw allow 22/tcp    # SSH - QUAN TRONG: phai allow truoc khi enable
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Kiem tra trang thai
sudo ufw status

# Ket qua mong doi:
# 22/tcp   ALLOW
# 80/tcp   ALLOW
# 443/tcp  ALLOW
# (khong co 4000, 27017, 7700)
```

**Tại sao không mở port 4000, 27017, 7700?**
- Port 4000 (shopee-api): Caddy sẽ proxy từ 443 → localhost:4000. Không cần expose ra ngoài.
- Port 27017 (MongoDB): Database không bao giờ được expose ra internet — nguy cơ bị tấn công trực tiếp.
- Port 7700 (Meilisearch): Tương tự MongoDB — chỉ shopee-api cần gọi nội bộ.

### 3.4 Clone repository

```bash
# Clone monorepo ve server
git clone https://github.com/<your-username>/shopee-project.git /var/www/shopee-project
cd /var/www/shopee-project

# Cai dat dependencies
pnpm install
```

---

## 4. Bước 3 — Backing Services (Docker)

Shopee-api cần 2 backing services chạy trong Docker: MongoDB và Meilisearch. Redis được dùng từ Redis Cloud (external) — không cần cài trên server.

### 4.1 Khởi động Docker Compose

```bash
cd /var/www/shopee-project

# Khoi dong tat ca backing services
docker compose up -d

# Kiem tra cac container dang chay
docker compose ps
```

Kết quả mong đợi:

```
NAME            IMAGE                        STATUS
mongodb         mongo:7                      Up
meilisearch     getmeili/meilisearch:v1.7    Up
```

### 4.2 Khởi tạo MongoDB Replica Set (một lần duy nhất)

MongoDB trong docker-compose được cấu hình với replica set `rs0`. Đây là yêu cầu bắt buộc để shopee-api hoạt động (dùng transactions và change streams). Bước này chỉ cần làm **một lần duy nhất** khi setup lần đầu.

```bash
# Ket noi vao MongoDB container
docker exec -it mongodb mongosh

# Trong mongosh, chay lenh khoi tao replica set
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})

# Kiem tra trang thai replica set
rs.status()

# Thoat mongosh
exit
```

Sau khi `rs.initiate()` thành công, bạn sẽ thấy `"ok": 1` trong kết quả. Từ đây, `MONGO_URI` trong `.env` phải có `?replicaSet=rs0`:

```
MONGO_URI=mongodb://localhost:27017/shopee?replicaSet=rs0
```

### 4.3 Meilisearch

Meilisearch khởi động tự động cùng Docker Compose. Không cần cấu hình thêm — shopee-api sẽ kết nối qua `MEILISEARCH_HOST=http://localhost:7700`.

### 4.4 Redis (Redis Cloud — external)

Redis **không** chạy trên server này. Dự án dùng Redis Cloud (hosted service). Bạn cần:
1. Tạo tài khoản tại https://redis.io/cloud (có free tier)
2. Tạo database, lấy connection URL
3. Điền vào `REDIS_URL` trong `.env` của shopee-api

Nếu `REDIS_URL` không được set hoặc Redis không kết nối được, shopee-api sẽ tự động fallback về in-memory cache (theo `CACHE_DRIVER=redis` trong config). Ứng dụng vẫn chạy được nhưng cache sẽ không persist giữa các lần restart.

### 4.5 Cấu hình Docker Compose tự khởi động khi reboot

```bash
# Bao dam Docker service tu khoi dong
sudo systemctl enable docker

# Them --restart policy vao docker-compose.yaml (neu chua co)
# Hoac dung docker compose restart policy trong file yaml:
# restart: unless-stopped
```

---

## 5. Bước 4 — Cấu hình & Build shopee-api

### 5.1 Tạo file .env cho shopee-api

Tạo file `/var/www/shopee-project/apps/shopee-api/.env` với nội dung sau. Thay thế các giá trị `<your-secret>` bằng giá trị thực của bạn.

```bash
# Tao file .env cho shopee-api
nano /var/www/shopee-project/apps/shopee-api/.env
```

Nội dung file `.env`:

```env
# ===== Core =====
NODE_ENV=production
PORT=4000

# ===== Database =====
# QUAN TRONG: phai co ?replicaSet=rs0
MONGO_URI=mongodb://localhost:27017/shopee?replicaSet=rs0

# ===== URLs (khop voi subdomain da cau hinh) =====
CLIENT_URL=https://shopee.lehoangtrong.com
FRONTEND_URL=https://shopee.lehoangtrong.com
APP_BASE_URL=https://api-ecom.lehoangtrong.com

# ===== JWT =====
# Phai >= 32 ky tu, cang dai cang tot
SECRET_KEY_JWT=<your-jwt-secret-at-least-32-chars>

# ===== Stripe =====
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>

# ===== MoMo =====
MOMO_PARTNER_CODE=<your-momo-partner-code>
MOMO_ACCESS_KEY=<your-momo-access-key>
MOMO_SECRET_KEY=<your-momo-secret-key>

# ===== VNPay =====
VNPAY_TMN_CODE=<your-vnpay-tmn-code>
VNPAY_HASH_SECRET=<your-vnpay-hash-secret>

# ===== Meilisearch =====
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=<your-meilisearch-master-key>

# ===== Redis =====
REDIS_URL=<your-redis-cloud-url>
CACHE_DRIVER=redis
```

### 5.2 Bảng tổng hợp các biến môi trường

| Biến | Giá trị production | Ghi chú |
|------|--------------------|---------|
| `NODE_ENV` | `production` | Bắt buộc |
| `PORT` | `4000` | Port Node.js lắng nghe |
| `MONGO_URI` | `mongodb://localhost:27017/shopee?replicaSet=rs0` | Phải có `?replicaSet=rs0` |
| `CLIENT_URL` | `https://shopee.lehoangtrong.com` | CORS origin cho storefront |
| `FRONTEND_URL` | `https://shopee.lehoangtrong.com` | Dùng trong email/redirect |
| `APP_BASE_URL` | `https://api-ecom.lehoangtrong.com` | Base URL của API |
| `SECRET_KEY_JWT` | `<your-secret>` | Tối thiểu 32 ký tự |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe live key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe webhook signing secret |
| `MOMO_PARTNER_CODE` | `<your-code>` | Từ MoMo Business |
| `MOMO_ACCESS_KEY` | `<your-key>` | Từ MoMo Business |
| `MOMO_SECRET_KEY` | `<your-secret>` | Từ MoMo Business |
| `VNPAY_TMN_CODE` | `<your-code>` | Từ VNPay Merchant |
| `VNPAY_HASH_SECRET` | `<your-secret>` | Từ VNPay Merchant |
| `MEILISEARCH_HOST` | `http://localhost:7700` | Nội bộ server |
| `MEILISEARCH_MASTER_KEY` | `<your-key>` | Tự đặt khi cài Meilisearch |
| `REDIS_URL` | `redis://...` | Redis Cloud URL |
| `CACHE_DRIVER` | `redis` | Fallback về in-memory nếu Redis lỗi |

### 5.3 Build shopee-api

```bash
cd /var/www/shopee-project

# Build chi shopee-api (TypeScript -> JavaScript)
# Lenh nay chay: tsc + tsc-alias -> output ra build/src/index.js
pnpm --filter @shopee/api build

# Hoac build toan bo monorepo (mat nhieu thoi gian hon)
nx run-many -t build
```

### 5.4 Chạy shopee-api với PM2

PM2 là process manager cho Node.js — nó giữ cho process chạy liên tục, tự restart khi crash, và khởi động lại khi server reboot.

```bash
cd /var/www/shopee-project

# Khoi dong shopee-api voi PM2
pm2 start apps/shopee-api/build/src/index.js \
  --name shopee-api \
  --cwd /var/www/shopee-project/apps/shopee-api

# Kiem tra trang thai
pm2 status

# Xem logs
pm2 logs shopee-api

# Luu cau hinh PM2 (de tu khoi dong khi reboot)
pm2 save

# Cai dat PM2 startup script (chay 1 lan, copy lenh no in ra va chay)
pm2 startup
# Lenh se in ra mot lenh sudo, copy va chay lenh do
```

Sau khi setup xong, kiểm tra API đang chạy:

```bash
# Kiem tra API co response khong
curl http://localhost:4000/health
# Hoac
curl http://localhost:4000/api/v1/health
```

---

## 6. Bước 5 — Đổi domain shop → shopee (6 chỗ hard-code)

Trong codebase hiện tại có **6 chỗ** hard-code domain `shop.lehoangtrong.com` thay vì `shopee.lehoangtrong.com`. Bạn cần sửa các chỗ này trước khi build shopee-web.

### 6.1 Bảng 6 chỗ cần sửa

| # | File | Dòng | Giá trị hiện tại | Đổi thành |
|---|------|------|------------------|-----------|
| 1 | `apps/shopee-web/src/constant/config.ts` | 6 | `siteUrl` default: `https://shop.lehoangtrong.com` | `https://shopee.lehoangtrong.com` |
| 2 | `apps/shopee-web/src/utils/http.ts` | 28 | `LOGIN_REDIRECT_URL` default: `https://shop.lehoangtrong.com` | `https://shopee.lehoangtrong.com` |
| 3 | `apps/shopee-web/public/sitemap.xml` | nhiều dòng | `<loc>https://shop.lehoangtrong.com/...</loc>` | `<loc>https://shopee.lehoangtrong.com/...</loc>` |
| 4 | `apps/shopee-web/public/robots.txt` | 7 | `Sitemap: https://shop.lehoangtrong.com/sitemap.xml` | `Sitemap: https://shopee.lehoangtrong.com/sitemap.xml` |
| 5 | `apps/shopee-web/index.html` | 20 | `og:url` content: `https://shop.lehoangtrong.com` | `https://shopee.lehoangtrong.com` |
| 6 | (nhóm 3, 4, 5) | — | Các static asset files | Xem chi tiết trên |

**Lưu ý:** Các chỗ 3, 4, 5 đều là static asset files (sitemap.xml, robots.txt, index.html) — chúng được copy nguyên vào `dist/` khi build. Phải sửa trước khi chạy `pnpm build`.

### 6.2 Cách sửa nhanh bằng sed

```bash
cd /var/www/shopee-project

# Sua config.ts
sed -i 's|https://shop\.lehoangtrong\.com|https://shopee.lehoangtrong.com|g' \
  apps/shopee-web/src/constant/config.ts

# Sua http.ts
sed -i 's|https://shop\.lehoangtrong\.com|https://shopee.lehoangtrong.com|g' \
  apps/shopee-web/src/utils/http.ts

# Sua sitemap.xml
sed -i 's|https://shop\.lehoangtrong\.com|https://shopee.lehoangtrong.com|g' \
  apps/shopee-web/public/sitemap.xml

# Sua robots.txt
sed -i 's|https://shop\.lehoangtrong\.com|https://shopee.lehoangtrong.com|g' \
  apps/shopee-web/public/robots.txt

# Sua index.html
sed -i 's|https://shop\.lehoangtrong\.com|https://shopee.lehoangtrong.com|g' \
  apps/shopee-web/index.html

# Kiem tra ket qua
grep -r "shop\.lehoangtrong\.com" apps/shopee-web/
# Ket qua mong doi: khong co output (da sua het)
```

### 6.3 Lưu ý về scripts/seed-users.ts

File `scripts/seed-users.ts` dòng 49 có email `admin@lehoangtrong.com`. Đây là email của tài khoản admin seed data — **không liên quan đến domain shopee/shop**. Không cần sửa file này trong quá trình đổi domain.

---

## 7. Bước 6 — Build shopee-web

### 7.1 Tại sao VITE_ vars phải set TRƯỚC khi build?

Đây là điểm quan trọng nhất khi làm việc với Vite. Các biến `VITE_*` được **baked in** (nhúng trực tiếp) vào JavaScript bundle tại thời điểm build — không phải runtime. Điều này có nghĩa là:

- Sau khi build xong, bạn **không thể** thay đổi `VITE_API_BASE_URL` trên server
- Nếu build với URL sai, bạn phải build lại từ đầu
- Không có cách nào inject biến vào static files sau khi đã build

```
+------------------------------------------+
|  Quy trinh build Vite                    |
|                                          |
|  .env.production                         |
|  VITE_API_BASE_URL=https://api-ecom...   |
|         |                                |
|         v                                |
|  vite build                              |
|         |                                |
|         v                                |
|  dist/assets/index-abc123.js             |
|  (chua san: "https://api-ecom...")       |
|                                          |
|  Sau build: khong the thay doi URL nua!  |
+------------------------------------------+
```

### 7.2 Tạo file .env.production cho shopee-web

```bash
# Tao file env cho shopee-web
nano /var/www/shopee-project/apps/shopee-web/.env.production
```

Nội dung:

```env
VITE_API_BASE_URL=https://api-ecom.lehoangtrong.com/
VITE_SOCKET_URL=https://api-ecom.lehoangtrong.com
VITE_SITE_URL=https://shopee.lehoangtrong.com
VITE_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
```

### 7.3 Bảng biến môi trường build-time của shopee-web

| Biến | Giá trị | Ghi chú |
|------|---------|---------|
| `VITE_API_BASE_URL` | `https://api-ecom.lehoangtrong.com/` | Trailing slash quan trọng |
| `VITE_SOCKET_URL` | `https://api-ecom.lehoangtrong.com` | Không có trailing slash |
| `VITE_SITE_URL` | `https://shopee.lehoangtrong.com` | URL của storefront |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe publishable key (public, an toàn) |

### 7.4 Build shopee-web

```bash
cd /var/www/shopee-project

# Build shopee-web
# Output se o: apps/shopee-web/dist/
pnpm --filter @shopee/web build

# Kiem tra output
ls apps/shopee-web/dist/
# Ket qua mong doi: index.html, assets/, ...
```

shopee-web có plugin gzip + brotli compression — các file `.gz` và `.br` sẽ được tạo tự động trong `dist/assets/`. Caddy/Nginx sẽ phục vụ các file nén này cho trình duyệt hỗ trợ, giúp tải trang nhanh hơn.

---

## 8. Bước 7 — Build shopee-admin

### 8.1 Tạo file .env.production cho shopee-admin

```bash
nano /var/www/shopee-project/apps/shopee-admin/.env.production
```

Nội dung:

```env
VITE_API_BASE_URL=https://api-ecom.lehoangtrong.com/
```

### 8.2 Bảng biến môi trường build-time của shopee-admin

| Biến | Giá trị | Ghi chú |
|------|---------|---------|
| `VITE_API_BASE_URL` | `https://api-ecom.lehoangtrong.com/` | Trailing slash quan trọng |

### 8.3 Build shopee-admin

```bash
cd /var/www/shopee-project

# Build shopee-admin
# Output se o: apps/shopee-admin/dist/
pnpm --filter @shopee/admin build

# Kiem tra output
ls apps/shopee-admin/dist/
# Ket qua mong doi: index.html, assets/, ...
```

---

## 9. Bước 8 — Reverse Proxy với Caddy

Caddy là lựa chọn ưu tiên vì nó **tự động xin và gia hạn SSL certificate** từ Let's Encrypt — không cần cấu hình certbot hay cron job. Chỉ cần domain đã trỏ đúng về IP, Caddy sẽ tự lo phần còn lại.

### 9.1 Tại sao cần SPA fallback?

shopee-web và shopee-admin đều là React SPA (Single Page Application) dùng React Router. Khi người dùng truy cập `https://shopee.lehoangtrong.com/products/123` lần đầu, trình duyệt gửi request đến server. Server cần trả về `index.html` — React Router sẽ xử lý route `/products/123` ở phía client.

Nếu không có SPA fallback (`try_files ... index.html`), server sẽ tìm file `products/123` trong thư mục dist — không tìm thấy → trả về 404. Người dùng nhấn F5 (refresh) trên bất kỳ route nào ngoài `/` sẽ bị lỗi 404.

### 9.2 Caddyfile hoàn chỉnh

Tạo file `/etc/caddy/Caddyfile`:

```bash
sudo nano /etc/caddy/Caddyfile
```

Nội dung Caddyfile:

```caddyfile
# ============================================================
# shopee.lehoangtrong.com -- Storefront (static SPA)
# ============================================================
shopee.lehoangtrong.com {
    # Thu muc chua static files sau khi build
    root * /var/www/shopee-project/apps/shopee-web/dist

    # Bat file server
    file_server

    # SPA fallback: neu file khong ton tai, tra ve index.html
    # Can thiet de React Router hoat dong khi F5 tren deep route
    try_files {path} /index.html

    # Encode gzip/brotli (Caddy tu dong chon dung loai)
    encode gzip zstd

    # Cache static assets lau (co hash trong ten file)
    @static {
        path /assets/*
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
}

# ============================================================
# shopee-admin.lehoangtrong.com -- Admin Panel (static SPA)
# ============================================================
shopee-admin.lehoangtrong.com {
    root * /var/www/shopee-project/apps/shopee-admin/dist

    file_server

    try_files {path} /index.html

    encode gzip zstd

    @static {
        path /assets/*
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
}

# ============================================================
# api-ecom.lehoangtrong.com -- Backend API (Node.js process)
# ============================================================
api-ecom.lehoangtrong.com {
    # Reverse proxy den shopee-api dang chay tren port 4000
    reverse_proxy localhost:4000 {
        # WebSocket support cho Socket.IO
        # Caddy tu dong xu ly Upgrade header
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Tang gioi han kich thuoc request body cho upload anh/file
    # Mac dinh Caddy khong gioi han, nhung nen dat ro rang
    request_body {
        max_size 50MB
    }

    encode gzip zstd
}
```

### 9.3 Áp dụng và kiểm tra Caddyfile

```bash
# Kiem tra cu phap Caddyfile truoc khi ap dung
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy (khong downtime)
sudo systemctl reload caddy

# Hoac restart neu can
sudo systemctl restart caddy

# Xem logs de kiem tra SSL certificate da duoc cap chua
sudo journalctl -u caddy -f
```

### 9.4 Caddy tự động HTTPS hoạt động như thế nào?

```
+------------------------------------------+
|  Caddy tu dong HTTPS (Let's Encrypt)     |
|                                          |
|  1. Caddy doc Caddyfile                  |
|     -> thay domain shopee.lehoangtrong.com|
|                                          |
|  2. Caddy ket noi Let's Encrypt ACME     |
|     -> xin certificate cho domain        |
|                                          |
|  3. Let's Encrypt gui HTTP challenge     |
|     -> Caddy tra loi qua port 80         |
|     -> DIEU KIEN: port 80 phai mo        |
|                                          |
|  4. Certificate duoc cap                 |
|     -> Caddy tu dong gia han truoc 30 ngay|
|     -> Luu tai: /var/lib/caddy/          |
|                                          |
|  5. Tat ca traffic tu dong redirect      |
|     HTTP -> HTTPS                        |
+------------------------------------------+
```

**Điều kiện để Caddy xin cert thành công:**
- Domain đã trỏ về IP `103.106.104.37` (DNS đã propagate)
- Port 80 và 443 đã mở trong firewall
- Server có thể kết nối ra internet (để liên lạc với Let's Encrypt)

---

## 10. Bước 8b — Nginx (phương án thay thế)

Nếu bạn muốn dùng Nginx thay vì Caddy, phần này cung cấp cấu hình tương đương. Nginx không tự động xin SSL — bạn cần dùng certbot.

### 10.1 Cài đặt Nginx và Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 10.2 Cấu hình Nginx server blocks

Tạo file `/etc/nginx/sites-available/shopee`:

```bash
sudo nano /etc/nginx/sites-available/shopee
```

Nội dung:

```nginx
# ============================================================
# shopee.lehoangtrong.com -- Storefront (static SPA)
# ============================================================
server {
    listen 80;
    server_name shopee.lehoangtrong.com;
    # Certbot se tu dong them redirect HTTPS sau khi cap cert
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name shopee.lehoangtrong.com;

    # SSL certificates (certbot se tu dong dien vao)
    ssl_certificate /etc/letsencrypt/live/shopee.lehoangtrong.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shopee.lehoangtrong.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/shopee-project/apps/shopee-web/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Cache static assets (co hash trong ten file)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback: moi route tra ve index.html
    # Can thiet de React Router hoat dong khi F5 tren deep route
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ============================================================
# shopee-admin.lehoangtrong.com -- Admin Panel (static SPA)
# ============================================================
server {
    listen 80;
    server_name shopee-admin.lehoangtrong.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name shopee-admin.lehoangtrong.com;

    ssl_certificate /etc/letsencrypt/live/shopee-admin.lehoangtrong.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shopee-admin.lehoangtrong.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/shopee-project/apps/shopee-admin/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ============================================================
# api-ecom.lehoangtrong.com -- Backend API + Socket.IO
# ============================================================
server {
    listen 80;
    server_name api-ecom.lehoangtrong.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api-ecom.lehoangtrong.com;

    ssl_certificate /etc/letsencrypt/live/api-ecom.lehoangtrong.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-ecom.lehoangtrong.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Tang gioi han kich thuoc body cho upload anh/file
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;

        # WebSocket support cho Socket.IO
        # Phai co 2 header nay de WebSocket Upgrade hoat dong
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout cho long-polling Socket.IO
        proxy_read_timeout 86400;
    }
}
```

### 10.3 Kích hoạt và xin SSL certificate

```bash
# Kich hoat site
sudo ln -s /etc/nginx/sites-available/shopee /etc/nginx/sites-enabled/

# Kiem tra cu phap Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Xin SSL certificate cho ca 3 subdomain
sudo certbot --nginx -d shopee.lehoangtrong.com
sudo certbot --nginx -d shopee-admin.lehoangtrong.com
sudo certbot --nginx -d api-ecom.lehoangtrong.com

# Kiem tra tu dong gia han (certbot da cai cron job)
sudo certbot renew --dry-run
```

---

## 11. Bước 9 — Kiểm tra end-to-end

Sau khi hoàn thành tất cả các bước trên, chạy checklist sau để xác nhận mọi thứ hoạt động đúng.

### 11.1 Kiểm tra DNS

```bash
# Kiem tra tung subdomain da tro ve dung IP chua
nslookup shopee.lehoangtrong.com
# Mong doi: Address: 103.106.104.37

nslookup shopee-admin.lehoangtrong.com
# Mong doi: Address: 103.106.104.37

nslookup api-ecom.lehoangtrong.com
# Mong doi: Address: 103.106.104.37
```

### 11.2 Kiểm tra API health endpoint

```bash
# Kiem tra API co response qua HTTPS khong
curl -v https://api-ecom.lehoangtrong.com/health

# Hoac kiem tra mot endpoint co san
curl https://api-ecom.lehoangtrong.com/api/v1/products?limit=1

# Mong doi: HTTP 200, JSON response
```

### 11.3 Kiểm tra HTTPS và SSL certificate

```bash
# Kiem tra SSL certificate hop le
curl -I https://shopee.lehoangtrong.com
# Mong doi: HTTP/2 200, khong co SSL warning

curl -I https://shopee-admin.lehoangtrong.com
# Mong doi: HTTP/2 200

curl -I https://api-ecom.lehoangtrong.com
# Mong doi: HTTP/2 200
```

### 11.4 Kiểm tra SPA fallback (F5 trên deep route)

Mở trình duyệt và truy cập một route sâu, ví dụ:
- `https://shopee.lehoangtrong.com/products/some-product-id`
- Nhấn F5 (refresh)
- Kết quả mong đợi: trang vẫn load bình thường, **không** bị 404

Nếu bị 404 khi F5, kiểm tra lại cấu hình `try_files` trong Caddy/Nginx.

### 11.5 Kiểm tra CORS

Mở DevTools (F12) trong trình duyệt khi đang ở `https://shopee.lehoangtrong.com`, vào tab Network, thực hiện một API call. Kiểm tra:
- Không có lỗi `CORS policy` trong Console
- Response header có `Access-Control-Allow-Origin: https://shopee.lehoangtrong.com`

Nếu có lỗi CORS, kiểm tra lại `CLIENT_URL` và `FRONTEND_URL` trong `.env` của shopee-api — phải khớp chính xác với `https://shopee.lehoangtrong.com` (không có trailing slash).

### 11.6 Kiểm tra Socket.IO

Mở trang shopee-web, đăng nhập, và kiểm tra tab Network trong DevTools:
- Filter theo `WS` (WebSocket)
- Phải thấy kết nối WebSocket đến `wss://api-ecom.lehoangtrong.com`
- Status: `101 Switching Protocols`

Nếu Socket.IO không kết nối được, kiểm tra:
- Caddy: `reverse_proxy` đã cấu hình đúng chưa
- Nginx: có `proxy_set_header Upgrade $http_upgrade` và `Connection "upgrade"` chưa

### 11.7 Kiểm tra payment callback URL

Các payment gateway (Stripe, MoMo, VNPay) gọi callback về `APP_BASE_URL`. Kiểm tra:

```bash
# Kiem tra endpoint callback co accessible khong
curl -X POST https://api-ecom.lehoangtrong.com/api/v1/payment/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
# Mong doi: 400 (thieu signature) - khong phai 404 hay 502
```

### 11.8 Checklist tổng hợp

```
[ ] nslookup shopee.lehoangtrong.com -> 103.106.104.37
[ ] nslookup shopee-admin.lehoangtrong.com -> 103.106.104.37
[ ] nslookup api-ecom.lehoangtrong.com -> 103.106.104.37
[ ] curl https://api-ecom.lehoangtrong.com/health -> 200
[ ] https://shopee.lehoangtrong.com mo duoc tren trinh duyet
[ ] https://shopee-admin.lehoangtrong.com mo duoc tren trinh duyet
[ ] F5 tren deep route khong bi 404
[ ] Khong co CORS error trong DevTools
[ ] Socket.IO ket noi thanh cong (WS 101)
[ ] SSL certificate hop le (khoa xanh tren trinh duyet)
[ ] pm2 status: shopee-api -> online
```

---

## 12. Phụ lục — Bảng tổng hợp & Troubleshooting

### 12.1 Bảng tổng hợp domains và ports

| Domain | Trỏ về | Loại | Port nội bộ | Ghi chú |
|--------|--------|------|-------------|---------|
| `shopee.lehoangtrong.com` | `103.106.104.37` | Static SPA | — | shopee-web/dist |
| `shopee-admin.lehoangtrong.com` | `103.106.104.37` | Static SPA | — | shopee-admin/dist |
| `api-ecom.lehoangtrong.com` | `103.106.104.37` | Node process | 4000 | PM2 managed |

| Service | Port | Expose ra ngoài? | Ghi chú |
|---------|------|-----------------|---------|
| Caddy/Nginx | 80, 443 | Có (public) | Reverse proxy |
| shopee-api | 4000 | Không (localhost only) | PM2 |
| MongoDB | 27017 | Không (localhost only) | Docker |
| Meilisearch | 7700 | Không (localhost only) | Docker |
| Redis | — | Không (external cloud) | Redis Cloud |

### 12.2 Troubleshooting các lỗi thường gặp

**Lỗi 502 Bad Gateway**

```
Nguyen nhan: shopee-api khong chay hoac PM2 bi down
Kiem tra:
  pm2 status
  pm2 logs shopee-api --lines 50

Giai phap:
  pm2 restart shopee-api
  # Neu van loi, kiem tra .env va build output:
  ls apps/shopee-api/build/src/index.js
```

**Lỗi 404 khi F5 trên deep route**

```
Nguyen nhan: Thieu SPA fallback trong Caddy/Nginx
Kiem tra Caddyfile:
  try_files {path} /index.html   <- phai co dong nay

Kiem tra Nginx:
  try_files $uri $uri/ /index.html;   <- phai co dong nay

Giai phap: Them fallback va reload Caddy/Nginx
```

**Lỗi CORS (Cross-Origin Request Blocked)**

```
Nguyen nhan: CLIENT_URL hoac FRONTEND_URL trong .env khong khop
             voi origin cua trinh duyet

Kiem tra:
  cat apps/shopee-api/.env | grep CLIENT_URL
  # Phai la: CLIENT_URL=https://shopee.lehoangtrong.com

Giai phap:
  1. Sua .env
  2. pm2 restart shopee-api
```

**Lỗi SSL certificate (ERR_SSL_PROTOCOL_ERROR hoặc cert không hợp lệ)**

```
Nguyen nhan: Port 80 bi block hoac DNS chua propagate

Kiem tra:
  sudo ufw status   <- port 80 phai ALLOW
  nslookup shopee.lehoangtrong.com   <- phai tra ve 103.106.104.37

Giai phap:
  1. Mo port 80: sudo ufw allow 80/tcp
  2. Cho DNS propagate (co the mat den 48 gio)
  3. Restart Caddy: sudo systemctl restart caddy
```

**Socket.IO không kết nối được**

```
Nguyen nhan: Reverse proxy khong forward WebSocket Upgrade header

Kiem tra Nginx:
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  <- Phai co ca 2 dong nay trong location block

Caddy: Tu dong xu ly WebSocket, khong can cau hinh them.
       Kiem tra shopee-api co dang chay khong: pm2 status
```

**MongoDB connection error (replicaSet)**

```
Nguyen nhan: MONGO_URI thieu ?replicaSet=rs0
             hoac chua chay rs.initiate()

Kiem tra:
  cat apps/shopee-api/.env | grep MONGO_URI
  # Phai co: ?replicaSet=rs0

  docker exec -it mongodb mongosh --eval "rs.status()"
  # Phai thay "ok": 1

Giai phap:
  1. Them ?replicaSet=rs0 vao MONGO_URI
  2. Neu chua initiate: docker exec -it mongodb mongosh
     -> rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})
  3. pm2 restart shopee-api
```

### 12.3 Các lệnh PM2 hữu ích

```bash
# Xem trang thai tat ca process
pm2 status

# Xem logs realtime
pm2 logs shopee-api

# Restart process
pm2 restart shopee-api

# Stop process
pm2 stop shopee-api

# Xem thong tin chi tiet
pm2 show shopee-api

# Reload (zero-downtime restart)
pm2 reload shopee-api

# Xem tat ca logs
pm2 logs --lines 100
```

### 12.4 Thứ tự deploy khi có code mới

Khi cần deploy phiên bản mới của ứng dụng:

```bash
cd /var/www/shopee-project

# 1. Pull code moi
git pull origin main

# 2. Cap nhat dependencies (neu co thay doi)
pnpm install

# 3. Sua cac file hard-code neu can (buoc 5)

# 4. Build lai shopee-api
pnpm --filter @shopee/api build
pm2 restart shopee-api

# 5. Build lai shopee-web (neu co thay doi frontend)
pnpm --filter @shopee/web build
# Caddy/Nginx tu dong phuc vu files moi - khong can restart

# 6. Build lai shopee-admin (neu co thay doi)
pnpm --filter @shopee/admin build
```

---

## 13. Triển khai chung VPS với project khác (twitter-api) {#13-trien-khai-chung-vps}

### 13.1 Bối cảnh: VPS đã chạy sẵn project khác

VPS tại IP `103.106.104.37` hiện đang chạy **twitter-api** (một Node process quản lý bởi PM2, bind port 4000) và một process cũ tên `ShopeeCloneTypescript` (phiên bản standalone của shopee-web trước khi chuyển sang monorepo). Bây giờ chúng ta muốn thêm toàn bộ shopee-project (3 apps: shopee-api, shopee-web, shopee-admin) lên **cùng VPS đó**, dưới cùng domain root `lehoangtrong.com`.

Sơ đồ trạng thái TRƯỚC và SAU khi triển khai:

```
TRUOC KHI TRIEN KHAI
+--------------------------------------------------+
|  VPS 103.106.104.37                              |
|                                                  |
|  PM2 processes:                                  |
|    [twitter-api]         port 4000  (dang chay)  |
|    [ShopeeCloneTypescript] port ???  (se xoa)    |
|                                                  |
|  nginx:                                          |
|    1 server block duy nhat                       |
|    server_name lehoangtrong.com                  |
|    -> proxy_pass localhost:4000                  |
+--------------------------------------------------+

SAU KHI TRIEN KHAI
+--------------------------------------------------+
|  VPS 103.106.104.37                              |
|                                                  |
|  PM2 processes:                                  |
|    [twitter-api]   port 4000  (giu nguyen)       |
|    [shopee-api]    port 4002  (MO I)             |
|    ShopeeCloneTypescript -> DA XOA               |
|                                                  |
|  nginx (1 instance, nhieu server block):         |
|    lehoangtrong.com        -> localhost:4000      |
|    api-ecom.lehoangtrong.com -> localhost:4002   |
|    shopee.lehoangtrong.com -> static dist/web    |
|    shopee-admin.*          -> static dist/admin  |
|                                                  |
|  shopee-web, shopee-admin = static files (dist/) |
|  Khong co process, khong chiem port              |
+--------------------------------------------------+
```

### 13.2 Nguyên tắc cốt lõi khi nhiều project chung 1 VPS

1. **Mỗi API (Node process) phải có PORT riêng.** Hai process không thể bind cùng một port — hệ điều hành sẽ báo lỗi `EADDRINUSE` và process thứ hai sẽ không khởi động được.

2. **web/admin sau khi build là STATIC files (dist/) — không phải process, không chiếm port.** Nginx đọc và trả về các file HTML/CSS/JS trực tiếp từ thư mục dist; không có Node process nào chạy cho chúng.

3. **Chỉ cần 1 instance nginx duy nhất, dùng NHIỀU server block (mỗi domain/subdomain 1 block).** Không cần cài thêm nginx hay chạy nhiều nginx — một nginx đã đủ để phục vụ tất cả các domain/subdomain trên cùng một máy.

### 13.3 Bảng phân bổ port (port allocation)

| Service | Loại | Port | Quản lý bởi | Ghi chú |
|---------|------|------|-------------|---------|
| twitter-api | Node process | 4000 | PM2 | Đã chạy sẵn, giữ nguyên |
| shopee-api | Node process | 4002 | PM2 | MỚI — đặt PORT=4002 để tránh đụng 4000 |
| shopee-web | Static (dist/) | — | nginx | Không chiếm port |
| shopee-admin | Static (dist/) | — | nginx | Không chiếm port |
| MongoDB | Docker | 27017 | Docker | Chỉ nội bộ |
| Meilisearch | Docker | 7700 | Docker | Chỉ nội bộ |

### 13.4 Gỡ bỏ process cũ ShopeeCloneTypescript

Trong monorepo, shopee-web được build thành static files (dist/) và phục vụ trực tiếp bởi nginx — không cần process Node nào chạy. Process `ShopeeCloneTypescript` là phiên bản standalone cũ, không còn phù hợp với kiến trúc monorepo và có thể đang chiếm một port không cần thiết. Cần xóa nó trước khi triển khai.

```bash
# 1. Xem danh sach process hien tai
pm2 ls

# 2. Xoa process cu (thay <id-hoac-ten> bang gia tri dung tu pm2 ls)
pm2 delete ShopeeCloneTypescript
# hoac theo id, vi du: pm2 delete 0

# 3. Luu lai trang thai de khong tu khoi dong lai sau reboot
pm2 save
```

**Lưu ý quan trọng:** Luôn chạy `pm2 ls` trước để xác nhận đúng tên hoặc id của process. Không xóa mù theo id 0 vì id có thể thay đổi tùy thứ tự khởi động.

### 13.5 Đặt PORT riêng cho shopee-api (PORT=4002)

Không cần thay đổi source code. File `apps/shopee-api/src/index.ts` đọc `process.env.PORT` (mặc định 4000 nếu không đặt). Chỉ cần đặt biến môi trường `PORT=4002` qua file `.env` và/hoặc `ecosystem.config.js`.

Thêm hoặc xác nhận dòng sau trong file `.env` của shopee-api:

```bash
PORT=4002
```

Dưới đây là `ecosystem.config.js` được khuyến nghị (thay thế file hiện tại tại `apps/shopee-api/ecosystem.config.js`). File hiện tại có vấn đề: tên process là `'index'` (không rõ ràng), thiếu `cwd`, và không đặt `PORT` nên mặc định về 4000 — đụng với twitter-api:

```js
module.exports = {
  apps: [
    {
      name: 'shopee-api',            // doi tu 'index' -> ten ro rang
      script: 'build/src/index.js',
      cwd: '/var/www/shopee-project/apps/shopee-api',  // dat dung thu muc lam viec
      env: {
        NODE_ENV: 'development',
        PORT: 4002,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4002,
        CLIENT_URL: 'https://shopee.lehoangtrong.com',
        FRONTEND_URL: 'https://shopee.lehoangtrong.com',
        APP_BASE_URL: 'https://api-ecom.lehoangtrong.com',
      },
    },
  ],
}
```

Sau khi cập nhật file, build và khởi động:

```bash
cd /var/www/shopee-project/apps/shopee-api
pnpm --filter @shopee/api build
pm2 start ecosystem.config.js --env production
pm2 save
```

### 13.6 Chỗ sửa thứ 7 — CORS whitelist (hard-code)

**Đây là điểm dễ bỏ sót nhất khi deploy lên domain mới.**

Ngoài 6 chỗ "shop→shopee" trong shopee-web đã nêu ở Section 6, còn một chỗ thứ 7 nằm trong API: file `apps/shopee-api/src/constants/cors.config.ts`. Mảng `ALLOWED_ORIGINS_PROD` hard-code domain `shopee-clone.com` và **không đọc biến môi trường** `CLIENT_URL` hay `FRONTEND_URL`. Vì vậy, dù đặt env đúng trong ecosystem.config.js, trình duyệt gọi từ `https://shopee.lehoangtrong.com` vẫn bị chặn CORS cho đến khi sửa mảng này.

Trạng thái hiện tại (BEFORE) của mảng `ALLOWED_ORIGINS_PROD` (khoảng dòng 14-24):

```ts
// BEFORE — chi co shopee-clone.com, khong co lehoangtrong.com
const ALLOWED_ORIGINS_PROD = [
  'https://shopee-clone.com',
  'https://www.shopee-clone.com',
  // ... cac entry khac (localhost, etc.)
]
```

Cần thêm hai domain mới (AFTER):

```ts
// AFTER — them 2 dong cho lehoangtrong.com
const ALLOWED_ORIGINS_PROD = [
  'https://shopee-clone.com',
  'https://www.shopee-clone.com',
  'https://shopee.lehoangtrong.com',       // THEM MOI
  'https://shopee-admin.lehoangtrong.com', // THEM MOI
  // ... cac entry khac (localhost, etc.)
]
```

Việc xóa các entry `shopee-clone.com` cũ là tùy chọn — có thể giữ lại nếu muốn hỗ trợ cả hai domain, hoặc xóa nếu không còn dùng domain đó.

Sau khi sửa file, rebuild và restart API:

```bash
pnpm --filter @shopee/api build && pm2 restart shopee-api
```

### 13.7 Cấu hình nginx — nhiều server block

Giữ nguyên block của twitter-api, thêm các block mới cho 3 subdomain của shopee. Tất cả nằm trong cùng một file nginx (ví dụ `/etc/nginx/sites-available/default` hoặc một file mới trong `sites-available` được symlink vào `sites-enabled`).

```nginx
# ============================================================
# Block 1: twitter-api (giu nguyen, khong thay doi)
# ============================================================
server {
        listen 80;
        listen [::]:80;
        root /var/www/html;
        index index.html index.htm index.nginx-debian.html;
        server_name lehoangtrong.com www.lehoangtrong.com;
        location / {
                proxy_pass http://localhost:4000;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }
}

# ============================================================
# Block 2: shopee-api (MO I — port 4002)
# ============================================================
server {
        listen 80;
        listen [::]:80;
        server_name api-ecom.lehoangtrong.com;

        client_max_body_size 25M;

        location / {
                proxy_pass http://localhost:4002;
                proxy_http_version 1.1;

                # WebSocket support (Socket.IO)
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';

                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_cache_bypass $http_upgrade;
        }
}

# ============================================================
# Block 3: shopee-web (static SPA)
# ============================================================
server {
        listen 80;
        listen [::]:80;
        server_name shopee.lehoangtrong.com;

        root /var/www/shopee-project/apps/shopee-web/dist;
        index index.html;

        location / {
                try_files $uri $uri/ /index.html;
        }
}

# ============================================================
# Block 4: shopee-admin (static SPA)
# ============================================================
server {
        listen 80;
        listen [::]:80;
        server_name shopee-admin.lehoangtrong.com;

        root /var/www/shopee-project/apps/shopee-admin/dist;
        index index.html;

        location / {
                try_files $uri $uri/ /index.html;
        }
}
```

Kiểm tra cú pháp và reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**HTTPS với Let's Encrypt:** Sau khi các block trên hoạt động ở HTTP (port 80) và DNS đã trỏ đúng, chạy certbot để tự động thêm block 443:

```bash
sudo certbot --nginx -d api-ecom.lehoangtrong.com -d shopee.lehoangtrong.com -d shopee-admin.lehoangtrong.com
```

Certbot sẽ tự động chỉnh sửa các block nginx để thêm cấu hình SSL. Xem thêm chi tiết về HTTPS tại Section 9 và 10.

**Lưu ý về MongoDB:** Nếu twitter-api cũng dùng MongoDB trên cùng VPS, hãy đảm bảo shopee-api dùng database name khác (shopee-api dùng db `shopee` theo cấu hình mặc định). Hai project có thể dùng chung một MongoDB instance miễn là tên database khác nhau.

### 13.8 Vì sao gõ api-ecom vẫn ra trang cũ? — nginx default_server

Đây là điểm gây nhầm lẫn phổ biến nhất khi mới làm quen với nginx và DNS.

**Hai lớp hoàn toàn độc lập:**

- **DNS** chỉ làm một việc: ánh xạ tên miền sang địa chỉ IP. Khi bạn thêm A record `api-ecom.lehoangtrong.com -> 103.106.104.37`, DNS chỉ nói "tên này trỏ đến IP đó" — không biết gì về port hay ứng dụng nào đang chạy.
- **nginx** nhận request HTTP đến IP:80, đọc HTTP header `Host` (ví dụ `Host: api-ecom.lehoangtrong.com`), rồi quyết định chuyển đến block nào.

**Điều gì xảy ra khi bạn gõ `api-ecom.lehoangtrong.com` lúc chỉ có 1 server block:**

1. DNS phân giải `api-ecom.lehoangtrong.com` → `103.106.104.37` (vì A record tồn tại).
2. Trình duyệt mở TCP đến `103.106.104.37:80` và gửi `Host: api-ecom.lehoangtrong.com`.
3. nginx nhận request, tìm server block có `server_name` khớp với `api-ecom.lehoangtrong.com`.
4. Không tìm thấy block nào khớp → nginx dùng **default server**.

Quy tắc chọn server block của nginx:

```
+-------------------------------------------------------------+
|  NGINX chon server block tren port 80 nhu the nao?          |
+-------------------------------------------------------------+
|  1. Tim block co server_name KHOP CHINH XAC Host header     |
|       -> "api-ecom..." khong khop block nao                 |
|                                                             |
|  2. Khong khop? -> Dung DEFAULT SERVER cho port do          |
|       - Co block danh dau "default_server" -> dung block do |
|       - KHONG co? -> dung BLOCK DAU TIEN tren port 80       |
|                                                             |
|  -> Chi co 1 block => no MAC NHIEN la default_server        |
|     => moi Host (ke ca "api-ecom") deu roi vao day          |
+-------------------------------------------------------------+
```

**Kết luận:** `api-ecom.lehoangtrong.com` "hoạt động" chỉ là **tác dụng phụ** — request rơi vào block duy nhất (twitter-api) vì không có block nào khớp. Đây không phải routing đúng. Bất kỳ subdomain nào trỏ đến IP đó đều sẽ ra trang twitter tương tự.

**Hệ quả thực tế cho shopee:** Bạn **bắt buộc** phải khai báo `server_name api-ecom.lehoangtrong.com;` tường minh (như trong 13.7) để nginx khớp chính xác và route đến shopee-api:4002 thay vì rơi vào block twitter.

**Tùy chọn: thêm catch-all block để chặn Host không xác định**

```nginx
# (Tuy chon) Block bat tat ca Host la, tra ve loi de khong "lo" sang site khac
server {
    listen 80 default_server;
    server_name _;
    return 444;
}
```

**Cảnh báo:** Nếu thêm block `default_server` này, block twitter-api phải có `server_name lehoangtrong.com www.lehoangtrong.com;` khớp chính xác (nó đã có sẵn) — nếu không, request đến `lehoangtrong.com` sẽ bị block catch-all chặn thay vì đến twitter.

### 13.9 Kiểm tra sau khi triển khai chung VPS

```bash
# 1. Ca 2 API deu chay (phai thay twitter-api VA shopee-api, KHONG con ShopeeCloneTypescript)
pm2 ls

# 2. shopee-api lang nghe dung port 4002
curl http://localhost:4002/health      # hoac route health that cua API

# 3. twitter-api van song
curl http://localhost:4000

# 4. Nginx route dung theo Host
curl -H "Host: api-ecom.lehoangtrong.com" http://localhost
curl -H "Host: shopee.lehoangtrong.com"   http://localhost

# 5. DNS phan giai dung
nslookup api-ecom.lehoangtrong.com    # -> 103.106.104.37
nslookup shopee.lehoangtrong.com      # -> 103.106.104.37

# 6. SPA deep route khong 404 khi F5
curl -I https://shopee.lehoangtrong.com/products/123

# 7. CORS: goi tu origin shopee khong bi chan
curl -I -H "Origin: https://shopee.lehoangtrong.com" https://api-ecom.lehoangtrong.com/health
```

Kết quả mong đợi:
- **Bước 1:** `pm2 ls` hiển thị `twitter-api` (online, port 4000) và `shopee-api` (online, port 4002). Không còn dòng `ShopeeCloneTypescript`.
- **Bước 2:** `curl localhost:4002/health` trả về HTTP 200 (hoặc JSON status ok từ shopee-api).
- **Bước 3:** `curl localhost:4000` trả về response từ twitter-api — xác nhận twitter vẫn sống.
- **Bước 4:** Mỗi `curl -H "Host: ..."` trả về response từ đúng ứng dụng tương ứng (không phải cùng một trang).
- **Bước 5:** `nslookup` trả về `103.106.104.37` cho cả hai subdomain.
- **Bước 6:** `curl -I` trả về HTTP 200 (nginx phục vụ `index.html` nhờ `try_files` SPA fallback, không phải 404).
- **Bước 7:** Response header `Access-Control-Allow-Origin: https://shopee.lehoangtrong.com` xuất hiện — xác nhận CORS whitelist đã được cập nhật đúng (bước 13.6).

---

## 14. So sánh deploy: Static SPA vs NextJS SSR {#14-so-sanh-static-vs-ssr}

Phần này giải thích **vì sao shopee-web/shopee-admin không cần port** (chỉ trỏ thẳng vào `dist/`), trong khi một ứng dụng **NextJS chạy SSR lại bắt buộc phải có port** (giống hệt API). Đây là điểm gây nhầm lẫn phổ biến: nhiều người tưởng "frontend thì không cần port, backend mới cần". **Sai.** Ranh giới thật sự là **TĨNH (static) vs ĐỘNG (server-side)**, không phải frontend vs backend.

### 14.1 Nguyên tắc cốt lõi — TĨNH vs ĐỘNG

> **TĨNH → `root` + `try_files` (trỏ thẳng dist/). ĐỘNG → `proxy_pass` (trỏ vào port của process đang sống).**

Cách phân biệt nhanh: **sau khi build xong, có còn một tiến trình Node.js đang chạy và lắng nghe port hay không?**

- Có process sống lắng nghe port → **trỏ port** (`proxy_pass`).
- Chỉ còn file tĩnh "chết" → **trỏ thẳng vào `dist/`** (`root` + `try_files`).

| | shopee-web / shopee-admin | NextJS (mặc định) | shopee-api / twitter-api |
|---|---|---|---|
| Công cụ | Vite | Next.js | Express / Node |
| Kiểu render | CSR (render ở **browser**) | SSR (render ở **server**) | Không render UI, trả JSON |
| Lệnh "lên sóng" | `vite build` → tắt | `next build` + **`next start`** (sống) | `node index.js` (sống) |
| Sau khi xong còn process? | ❌ Không | ✅ Có, nghe :3000 | ✅ Có, nghe :4000 |
| Nginx trỏ kiểu gì | `root dist` + `try_files` | **`proxy_pass :3000`** | `proxy_pass :4000` |
| Cần PM2 nuôi? | ❌ | ✅ | ✅ |

→ Để ý: **NextJS nằm CÙNG CỘT với API**, không cùng cột với shopee-web. Đó là lý do nó cần port.

### 14.2 BLOCK A — Static SPA (shopee-web kiểu trỏ thẳng `dist/`)

```nginx
# ============================================================
# BLOCK A — STATIC SPA (Vite)
# Vi du: shopee.lehoangtrong.com  ->  shopee-web/dist
# Khong co process, khong co port. Nginx tu doc file tra ve.
# ============================================================
server {
    listen 80;
    listen [::]:80;
    server_name shopee.lehoangtrong.com;

    # (1) Thu muc goc — tro THANG vao output cua "vite build"
    root /var/www/shopee-project/apps/shopee-web/dist;

    # (2) File mac dinh khi truy cap mot thu muc
    index index.html;

    # (3) Nen on-the-fly cho text/js/css
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # (4) Cache manh cho asset co hash trong ten file
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # (5) SPA fallback — TRAI TIM cua block nay
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Giải thích từng directive (Block A):**

| # | Directive | Làm gì | Vì sao cần |
|---|-----------|--------|------------|
| (1) | `root .../dist` | Khai báo thư mục gốc chứa file tĩnh. Mọi request `/x/y` → nginx tìm file tại `dist/x/y` trên ổ đĩa. | Đây chính là điểm "trỏ thẳng vào dist". Không có `proxy_pass` nào cả vì **không có process nào để trỏ tới** — chỉ có file chết. |
| (2) | `index index.html` | Khi URL kết thúc bằng `/`, trả `index.html`. | SPA chỉ có 1 file HTML duy nhất làm entry. |
| (3) | `gzip on` | Nén response trước khi gửi. | Bundle JS của React khá nặng, nén giảm 60-70% dung lượng. (Nếu đã có file `.br`/`.gz` từ plugin build thì có thể dùng `gzip_static`/`brotli_static` thay vì nén lại on-the-fly.) |
| (4) | `location /assets/` + `expires 1y` | Cache vĩnh viễn các file trong `assets/`. | Vite đặt hash vào tên file (`index-abc123.js`). Nội dung đổi → tên đổi → cache cũ tự bị bỏ. Nên cache 1 năm là an toàn tuyệt đối. |
| (5) | `try_files $uri $uri/ /index.html` | Thử 3 bước: tìm file đúng tên → tìm thư mục → **nếu không có thì trả `index.html`**. | **Đây là directive sống còn của SPA.** Khi user F5 ở `/products/123`, trên đĩa không có file đó. Không có dòng này → nginx trả 404. Có dòng này → nginx trả `index.html`, React Router đọc URL ở client và vẽ đúng trang. |

**Cốt lõi Block A:** Nginx đóng vai một **người phục vụ file** thuần túy. Nó đọc byte từ đĩa, gửi về browser, xong. Toàn bộ việc dựng giao diện do React làm **trong trình duyệt của khách**.

### 14.3 BLOCK B — NextJS SSR (kiểu `proxy_pass :3000`)

```nginx
# ============================================================
# BLOCK B — NEXTJS SERVER MODE (SSR)
# Vi du: web-ssr.lehoangtrong.com  ->  next start (port 3000)
# Co MOT process Node.js song, PM2 nuoi, om port 3000.
# Nginx KHONG doc file — no chuyen tiep request cho process.
# ============================================================
server {
    listen 80;
    listen [::]:80;
    server_name web-ssr.lehoangtrong.com;

    # KHONG co "root", KHONG co "try_files".
    # Vi giao dien duoc render BOI PROCESS, khong nam san tren dia.

    location / {
        # (1) Chuyen tiep request den process NextJS dang nghe :3000
        proxy_pass http://localhost:3000;

        # (2) Dung HTTP/1.1 (bat buoc cho keep-alive & WebSocket)
        proxy_http_version 1.1;

        # (3) Cho phep nang cap len WebSocket (HMR/streaming neu co)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # (4) Cac header chuyen tiep — de NextJS biet client THAT
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # (5) Bo qua cache khi co Upgrade
        proxy_cache_bypass $http_upgrade;
    }

    # (6) Asset tinh cua NextJS van duoc nginx cache giup (tuy chon)
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

**Giải thích từng directive (Block B):**

| # | Directive | Làm gì | Vì sao cần |
|---|-----------|--------|------------|
| (1) | `proxy_pass http://localhost:3000` | Chuyển tiếp request tới process Node đang nghe `:3000` (chính là `next start`). | **Đây là khác biệt cốt lõi.** Vì có một server đang sống render HTML động, nginx không thể "đọc file" — nó phải hỏi process. Giống hệt cách trỏ API `:4000`. |
| (2) | `proxy_http_version 1.1` | Ép dùng HTTP/1.1 giữa nginx ↔ process. | Mặc định nginx nói HTTP/1.0 với upstream, vốn không hỗ trợ `Upgrade`/keep-alive. Bắt buộc bật 1.1 để WebSocket và streaming chạy. |
| (3) | `Upgrade` + `Connection 'upgrade'` | Cho phép bắt tay nâng cấp HTTP → WebSocket. | NextJS dùng cho streaming SSR / HMR (dev) / hoặc nếu app có realtime. Để sẵn cho an toàn. |
| (4) | 4 header `Host`/`X-Real-IP`/`X-Forwarded-*` | Báo cho process biết tên miền gốc, IP thật của khách, và scheme (http/https). | SSR cần `Host` đúng để render link tuyệt đối, redirect, và sinh canonical URL. Thiếu `X-Forwarded-Proto` → app tưởng đang chạy http → sinh link sai/redirect loop. |
| (5) | `proxy_cache_bypass $http_upgrade` | Không cache khi đang nâng cấp WebSocket. | Tránh nginx cache nhầm một kết nối realtime. |
| (6) | `location /_next/static/` | Cache riêng asset tĩnh của NextJS. | NextJS cũng tạo file hash trong `/_next/static/`. Cache giúp giảm tải process. (Tùy chọn — bỏ qua vẫn chạy.) |

**Cốt lõi Block B:** Nginx đóng vai **người chuyển tiếp (middleman)**. Mỗi request nó gõ cửa process `:3000`, process render HTML rồi đưa lại, nginx chuyển về khách. Process **phải sống liên tục** — đó là lý do cần PM2 và cần port.

### 14.4 So sánh trực diện 2 block

```
        BLOCK A (Static SPA)              BLOCK B (NextJS SSR)
        ----------------------           ----------------------
URL ->  nginx                            nginx
          |                                |
          | doc file tu dia                | proxy_pass :3000
          v                                v
        dist/index.html                  process Node (PM2)
        (file CHET)                      next start (SONG)
          |                                | render HTML dong
          v                                v
        browser tu chay React            HTML san -> browser
```

| Tiêu chí | Block A — Static | Block B — NextJS SSR |
|----------|------------------|----------------------|
| Directive định tuyến | `root` + `try_files` | `proxy_pass :3000` |
| Có `root`? | ✅ Có (trỏ dist/) | ❌ Không |
| Có `try_files ... /index.html`? | ✅ Bắt buộc (SPA fallback) | ❌ Không (NextJS tự lo routing) |
| Có process sống? | ❌ Không | ✅ Có, nghe :3000 |
| Cần PM2? | ❌ | ✅ |
| Nginx làm gì | Đọc & trả file | Chuyển tiếp cho process |
| F5 deep route hỏng nếu thiếu | thiếu `try_files` → 404 | NextJS tự xử lý, không cần fallback nginx |
| Cùng nhóm với | (không có process) | shopee-api / twitter-api `proxy_pass :4000` |

### 14.5 Ba ghi chú đáng nhớ (gotchas)

1. **Tuyệt đối không trộn 2 kiểu.** Đừng vừa `root dist` vừa `proxy_pass` trong cùng một block — nginx sẽ ưu tiên `proxy_pass` và `root` thành vô nghĩa, hoặc ngược lại gây 404 khó hiểu.

2. **Block B không cần `try_files`.** Đây là lỗi hay gặp: nhiều người copy `try_files ... /index.html` từ block SPA sang block NextJS. **Sai.** NextJS server tự định tuyến mọi URL — nhét fallback vào sẽ phá routing động của nó.

3. **`X-Forwarded-Proto $scheme` cực kỳ quan trọng với SSR.** Nếu thiếu, NextJS chạy sau HTTPS nginx vẫn tưởng mình ở `http://`, dẫn đến sinh link sai hoặc vòng lặp redirect khi dùng `next-auth`, `getServerSideProps` có redirect, v.v. Block A (static) không quan tâm điều này vì không có server nào render.

> **Tóm tắt một câu:** shopee-web/admin không cần port vì chúng là SPA tĩnh (Vite, render ở browser) — build xong là file chết. NextJS SSR cần port vì `next start` tạo ra một server Node.js sống ở port 3000, đúng bản chất "động" như API, nên phải `proxy_pass` y hệt. Việc cần port hay không do **TĨNH vs ĐỘNG** quyết định, không do **frontend vs backend**.

---

*Tài liệu này được tạo ngày 30/05/2026. Phiên bản 1.1 — cập nhật ngày 01/06/2026 (bổ sung Section 14: So sánh Static SPA vs NextJS SSR).*



