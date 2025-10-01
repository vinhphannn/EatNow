# Environment Variables Setup

## Backend Environment (.env)

Create `backend/.env` file with the following variables:

```env
# Server Configuration
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/eatnow

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3001

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DEST=uploads

# WebSocket
WS_PORT=3000
```

## Frontend Environment (.env.local)

Create `frontend/.env.local` file with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## Important Notes

1. **Never commit `.env` files to git** - They contain sensitive information
2. **Use strong JWT secrets** in production
3. **Update CORS origins** for production deployment
4. **Use environment-specific MongoDB URIs** for different environments
