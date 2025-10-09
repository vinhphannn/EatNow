# 🛠️ EatNow Setup Guide

## 📋 Prerequisites

- Node.js 18+
- MongoDB
- Git

## 🚀 Quick Setup (Local MongoDB + Redis)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd EatNow
```

### 2. Backend Setup (PORT 3001)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB & Redis URIs
npm run start:dev
```

### 3. Frontend Setup (PORT 3002)
```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 > .env.local
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/eatnow
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Port Already in Use**
   - Change ports in `.env` files
   - Kill processes using the ports

3. **Module Not Found Errors**
   - Run `npm install` in both directories
   - Clear `node_modules` and reinstall if needed

## 📝 Development Notes

- TypeScript for type safety
- Tailwind CSS for styling
- Socket.io for real-time features
- Mongoose for MongoDB operations
- Next.js 13+ with App Router
