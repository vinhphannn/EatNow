# Environment Setup Guide

## Frontend Setup

1. **Tạo file `.env.local` trong thư mục `frontend/`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

2. **Restart frontend:**
```bash
cd frontend
npm run dev
```

## Backend Setup

1. **Tạo file `.env` trong thư mục `backend/`:**
```bash
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/eatnow
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

2. **Restart backend:**
```bash
cd backend
npm start
```

## Kiểm tra hoạt động

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Swagger Docs**: http://localhost:3001/api

## Lưu ý

- Tất cả hardcoded URLs đã được thay thế bằng environment variables
- Các file test không cần thiết đã được xóa
- Debug logs đã được làm sạch
