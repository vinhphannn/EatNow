# EatNow - Food Delivery App Setup Guide

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Git

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd EatNow
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Environment Setup

#### Backend Environment
Create `backend/.env` file:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/eatnow
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

#### Frontend Environment
Create `frontend/.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### 4. Database Setup
Make sure MongoDB is running on your system:
```bash
# Start MongoDB (if not running)
mongod
```

### 5. Run the Application

#### Start Backend
```bash
cd backend
npm run start:dev
```

#### Start Frontend (in new terminal)
```bash
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api

## 📁 Project Structure

```
EatNow/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Authentication
│   │   ├── user/           # User management
│   │   ├── restaurant/     # Restaurant management
│   │   ├── order/          # Order management
│   │   ├── cart/           # Shopping cart
│   │   ├── driver/         # Driver management
│   │   ├── notification/   # WebSocket notifications
│   │   └── common/         # Shared utilities
│   ├── dist/               # Compiled files (ignored by git)
│   └── node_modules/       # Dependencies (ignored by git)
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/            # Next.js 13+ app directory
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   └── store/          # State management
│   ├── .next/              # Next.js build (ignored by git)
│   └── node_modules/       # Dependencies (ignored by git)
├── mobile/                 # Flutter Mobile App
└── README.md
```

## 🔧 Available Scripts

### Backend
- `npm run start` - Start production server
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🗄️ Database Collections

The app uses the following MongoDB collections:
- `users` - User accounts
- `restaurants` - Restaurant information
- `items` - Menu items
- `orders` - Order records
- `carts` - Shopping carts
- `addresses` - User addresses

## 🔐 Authentication

The app uses JWT-based authentication with the following roles:
- `customer` - Regular users
- `restaurant` - Restaurant owners
- `driver` - Delivery drivers
- `admin` - System administrators

## 📱 Features

### Customer Features
- Browse restaurants and menus
- Add items to cart
- Place orders
- Track order status (real-time)
- Manage addresses
- Order history

### Restaurant Features
- Manage restaurant profile
- Add/edit menu items
- View and manage orders
- Real-time order notifications

### Driver Features
- View available orders
- Accept/decline orders
- Update delivery status

### Admin Features
- User management
- Restaurant approval
- System monitoring

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Port Already in Use**
   - Change ports in `.env` files
   - Kill processes using the ports

3. **Module Not Found Errors**
   - Run `npm install` in both backend and frontend directories
   - Clear `node_modules` and reinstall if needed

4. **WebSocket Connection Issues**
   - Check CORS settings in backend
   - Ensure both servers are running

## 📝 Development Notes

- The app uses TypeScript for type safety
- Tailwind CSS for styling
- Socket.io for real-time features
- Mongoose for MongoDB operations
- Next.js 13+ with App Router

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
