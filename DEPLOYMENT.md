# 🚀 EatNow Deployment Guide

## 🌐 Production Deployment

### Backend Deployment (Render/Railway)

1. **Connect Repository**
   - Connect your GitHub repository to Render/Railway
   - Select the `backend` directory as root

2. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eatnow
   JWT_SECRET=your-production-jwt-secret
   JWT_EXPIRES_IN=7d
   REDIS_URL=redis://username:password@host:port
   ```

3. **Build Settings**
   - Build Command: `npm run build`
   - Start Command: `npm run start`

### Frontend Deployment (Vercel/Netlify)

1. **Connect Repository**
   - Connect your GitHub repository to Vercel/Netlify
   - Select the `frontend` directory as root

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api/v1
   NEXT_PUBLIC_WS_URL=wss://your-backend-url.com
   ```

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`

## 🐳 Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start"]
```

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3002
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/eatnow
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3002:3002"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
    depends_on:
      - backend

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

## 🔧 Environment Configuration

### Production Environment Variables

#### Backend
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eatnow
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
REDIS_URL=redis://username:password@host:port
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com
NEXT_PUBLIC_APP_NAME=EatNow
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📊 Database Setup

### MongoDB Atlas
1. Create MongoDB Atlas cluster
2. Configure network access (0.0.0.0/0 for production)
3. Create database user
4. Get connection string

### Redis Cloud
1. Create Redis Cloud account
2. Create new database
3. Get connection string

## 🔒 Security Considerations

### Backend Security
- Use strong JWT secrets
- Enable CORS for specific domains
- Implement rate limiting
- Use HTTPS in production
- Validate all inputs

### Frontend Security
- Use HTTPS
- Implement CSP headers
- Sanitize user inputs
- Use secure cookies

## 📈 Performance Optimization

### Backend
- Enable gzip compression
- Implement caching
- Use connection pooling
- Optimize database queries

### Frontend
- Enable Next.js optimizations
- Use CDN for static assets
- Implement image optimization
- Use lazy loading

## 🔍 Monitoring

### Health Checks
```javascript
// Backend health check
GET /health

// Response
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

### Logging
- Use structured logging
- Implement log aggregation
- Monitor error rates
- Track performance metrics

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**
   - Check MongoDB URI
   - Verify network access
   - Check credentials

2. **CORS Errors**
   - Update CORS_ORIGIN
   - Check frontend URL

3. **Build Failures**
   - Check Node.js version
   - Clear node_modules
   - Check environment variables

## 📝 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connections tested
- [ ] SSL certificates installed
- [ ] Domain names configured
- [ ] Health checks working
- [ ] Error monitoring setup
- [ ] Performance monitoring setup
- [ ] Backup strategy implemented
