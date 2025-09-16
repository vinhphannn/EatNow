# 🔧 Cloudinary Setup Guide

## Bước 1: Tạo tài khoản Cloudinary

1. Truy cập: https://cloudinary.com
2. Đăng ký tài khoản miễn phí
3. Xác nhận email

## Bước 2: Lấy thông tin từ Dashboard

1. Đăng nhập vào Cloudinary Dashboard
2. Vào **Settings** > **General**
3. Copy các thông tin sau:
   - **Cloud Name**: `your_cloud_name`
   - **API Key**: `your_api_key`
   - **API Secret**: `your_api_secret`

## Bước 3: Tạo Upload Preset

1. Vào **Settings** > **Upload**
2. Click **Add upload preset**
3. Cấu hình:
   - **Preset name**: `eatnow_upload` (hoặc tên khác)
   - **Signing Mode**: `Unsigned`
   - **Folder**: `eatnow`
   - **Quality**: `Auto` (quan trọng!)
   - **Format**: `Auto` (quan trọng!)
   - **Transformation**: `q_auto,f_auto` (tối ưu ảnh tự động)
4. Click **Save**

**Lưu ý**: Với unsigned upload, quality và format phải được set trong preset, không thể gửi qua API.

## Bước 4: Tạo file .env.local

Tạo file `.env.local` trong thư mục `frontend` với nội dung:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=eatnow_upload

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## Bước 5: Restart server

```bash
# Dừng server (Ctrl+C)
# Chạy lại
npm start
```

## Bước 6: Test

1. Truy cập: http://localhost:3002/test-cloudinary
2. Upload ảnh để test

## Lỗi thường gặp:

### 401 Unauthorized
- Kiểm tra Cloud Name và Upload Preset
- Đảm bảo Upload Preset được set là "Unsigned"

### 400 Bad Request
- Kiểm tra file ảnh có đúng format không
- Kiểm tra kích thước file (max 10MB)

### 403 Forbidden
- Kiểm tra Upload Preset có đúng quyền không
- Kiểm tra API Key có đúng không

## Hỗ trợ:

Nếu gặp lỗi, hãy kiểm tra:
1. File `.env.local` có tồn tại không
2. Các biến môi trường có đúng không
3. Upload Preset có được tạo đúng không
4. Server đã được restart chưa
