# Scripts Documentation

Tài liệu hướng dẫn sử dụng các script TypeScript để quản lý dữ liệu.

## 📚 Danh sách Scripts (Đã được tối ưu)

### 1. **import-complete.ts** - Import toàn bộ dữ liệu (KHUYẾN NGHỊ)

**Mục đích**: Import cả categories và products từ file JSON vào MongoDB với error handling tốt

```bash
npx ts-node scripts/import-complete.ts
```

**Chức năng**:

- Xóa toàn bộ dữ liệu cũ
- Import 3 categories cơ bản từ `main.categories.json`
- Import tất cả products từ `main.products.json`
- Tự động gán location mặc định cho products chưa có
- Error handling chi tiết

### 2. **add-new-categories.ts** - Thêm categories mới

**Mục đích**: Thêm các categories mới vào database

```bash
npx ts-node scripts/add-new-categories.ts
```

**Categories được thêm**:

- Đồ gia dụng
- Thiết bị điện tử
- Đồ chơi
- Mỹ phẩm
- Thực phẩm
- Đồ thể thao
- Phụ kiện
- Giày dép
- Túi xách
- Nước hoa

### 3. **check-database.ts** - Kiểm tra trạng thái database

**Mục đích**: Kiểm tra và hiển thị thống kê database

```bash
npx ts-node scripts/check-database.ts
```

**Thông tin hiển thị**:

- Số lượng categories và products
- Danh sách tất cả categories
- Sample products với location và category
- Thống kê products theo location

### 4. **test-chatbot.ts** - Test chatbot functionality

**Mục đích**: Test kết nối và chức năng chatbot

```bash
npx ts-node scripts/test-chatbot.ts
```

**Tính năng**:

- Test kết nối Anthropic Claude API
- Test tạo conversation
- Test gửi tin nhắn chatbot
- Báo cáo kết quả test

## 🗄️ Trạng thái Database hiện tại

Sau khi chạy các script, database sẽ có:

- **13 categories** (3 gốc + 10 mới)
- **95+ products** với đầy đủ thông tin
- **4 locations**: Hồ Chí Minh, Hà Nội, Đà Nẵng, Cần Thơ

## 📍 Phân bổ sản phẩm theo location:

- Hồ Chí Minh: ~34 products
- Đà Nẵng: ~23 products
- Cần Thơ: ~20 products
- Hà Nội: ~18 products

## 🚀 Quy trình chạy Script

### Lần đầu tiên setup:

```bash
# 1. Import toàn bộ dữ liệu (khuyến nghị)
npx ts-node scripts/import-complete.ts

# 2. Thêm categories mới
npx ts-node scripts/add-new-categories.ts

# 3. Kiểm tra kết quả
npx ts-node scripts/check-database.ts

# 4. Test chatbot (optional)
npx ts-node scripts/test-chatbot.ts
```

### Khi cần reset database:

```bash
# Import lại từ đầu (sẽ xóa dữ liệu cũ)
npx ts-node scripts/import-complete.ts
npx ts-node scripts/add-new-categories.ts
```

### Khi cần kiểm tra database:

```bash
npx ts-node scripts/check-database.ts
```

## 📝 Lưu ý

1. **Environment Variables**: Đảm bảo file `.env` có đầy đủ thông tin database:

   ```
   USERNAME_DB=your_username
   PASSWORD_DB=your_password
   ```

2. **File dữ liệu**: Cần có sẵn:

   - `main.categories.json` (3 categories cơ bản)
   - `main.products.json` (95+ products)

3. **Dependencies**: Cần cài đặt:

   ```bash
   npm install mongoose dotenv typescript ts-node
   ```

4. **Database Connection**: Scripts sử dụng MongoDB Atlas cluster

## 🛠️ Scripts cũ (JavaScript)

Các script JavaScript cũ vẫn có thể sử dụng nhưng không được khuyến khích:

- `import-to-mongodb.js`
- `import-via-api.js`
- `import-with-mongoose.js`
- `update-products.js`

**Khuyến nghị**: Sử dụng các script TypeScript mới để có trải nghiệm tốt hơn và type safety.
