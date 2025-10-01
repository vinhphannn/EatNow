# 🔧 Hướng dẫn cấu hình Cloudinary cho Upload Hình ảnh

## ⚠️ Vấn đề hiện tại
Hiện tại bạn chưa thể upload file trực tiếp vì Cloudinary chưa được cấu hình. Bạn có thể:
- ✅ **Dán link hình ảnh** (hoạt động ngay)
- ❌ **Upload file từ máy** (cần cấu hình Cloudinary)

## 🚀 Cách cấu hình Cloudinary

### Bước 1: Tạo tài khoản Cloudinary
1. Truy cập: https://cloudinary.com
2. Đăng ký tài khoản miễn phí
3. Xác nhận email

### Bước 2: Lấy thông tin từ Dashboard
1. Đăng nhập vào Cloudinary Dashboard
2. Vào **Settings** > **General**
3. Copy các thông tin sau:
   - **Cloud Name**: `your_cloud_name`
   - **API Key**: `your_api_key`
   - **API Secret**: `your_api_secret`

### Bước 3: Tạo Upload Preset
1. Vào **Settings** > **Upload**
2. Click **Add upload preset**
3. Cấu hình:
   - **Preset name**: `eatnow_upload`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `eatnow`
   - **Quality**: `Auto`
   - **Format**: `Auto`
   - **Transformation**: `q_auto,f_auto`
4. Click **Save**

### Bước 4: Tạo file .env.local
Tạo file `.env.local` trong thư mục `frontend` với nội dung:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=eatnow_upload

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

**⚠️ Quan trọng**: Thay thế `your_actual_*` bằng thông tin thật từ Cloudinary Dashboard!

### Bước 5: Restart server
```bash
# Dừng server (Ctrl+C)
# Chạy lại
npm start
```

### Bước 6: Test
1. Truy cập: http://localhost:3002/test-cloudinary
2. Thử upload ảnh để kiểm tra

## 🔍 Kiểm tra cấu hình

Sau khi cấu hình, bạn sẽ thấy:
- ✅ Upload file trực tiếp từ máy tính
- ✅ Preview hình ảnh ngay lập tức
- ✅ Tối ưu hình ảnh tự động
- ✅ URLs bảo mật từ Cloudinary

## 🆘 Nếu gặp lỗi

### 401 Unauthorized
- Kiểm tra Cloud Name và Upload Preset
- Đảm bảo Upload Preset được set là "Unsigned"

### 400 Bad Request
- Kiểm tra file ảnh có đúng format không
- Kiểm tra kích thước file (max 10MB)

### 403 Forbidden
- Kiểm tra Upload Preset có đúng quyền không
- Kiểm tra API Key có đúng không

## 💡 Tạm thời sử dụng URL

Nếu chưa muốn setup Cloudinary, bạn có thể:
1. Tìm hình ảnh trên internet
2. Copy link hình ảnh
3. Dán vào ô "Dán link hình ảnh"
4. Nhấn Save

**Ví dụ URLs hình ảnh món ăn:**
- https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500
- https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500
- https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500


