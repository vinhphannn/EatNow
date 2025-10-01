# Hướng dẫn Deploy Frontend với Client-Side Rendering (CSR)

## Tổng quan
Frontend đã được chuyển đổi từ Server-Side Rendering (SSR) sang Client-Side Rendering (CSR) để giảm tải cho server. Server chỉ cần phục vụ API và static files.

## Các thay đổi đã thực hiện

### 1. Next.js Configuration (`next.config.js`)
- Thêm `output: 'export'` để tạo static files
- Thêm `trailingSlash: true` và `skipTrailingSlashRedirect: true`
- Đặt `distDir: 'dist'` để output vào thư mục dist
- Thêm `images: { unoptimized: true }` để tương thích với static export

### 2. Layout và Page Components
- Thêm `"use client"` directive vào tất cả components
- Sử dụng `dynamic import` cho các components để tránh SSR issues
- Chuyển đổi server-side redirects thành client-side redirects

### 3. Package.json Scripts
- Thêm script `build:static` để build static files

## Cách Build và Deploy

### 1. Build Static Files
```bash
cd frontend
npm run build:static
```

### 2. Chạy Server
Có 2 cách để chạy:

#### Option A: Next.js Server (Recommended)
```bash
npm start
```
- Chạy trên port 3002
- Hỗ trợ cả static pages và dynamic routes
- Tối ưu cho production

#### Option B: Static Server (Chỉ static files)
```bash
npm run start:static
```
- Chạy trên port 3001
- Chỉ serve static files
- Dynamic routes sẽ không hoạt động

### 3. Deploy Static Files
Sau khi build, thư mục `frontend/dist` sẽ chứa tất cả static files có thể deploy lên:

**Lưu ý**: Build hiện tại sử dụng hybrid approach:
- **Static pages (○)**: 36 trang được prerender thành static HTML
- **Dynamic pages (λ)**: 2 trang vẫn cần server-side rendering:
  - `/customer/orders/[id]` - Trang chi tiết đơn hàng
  - `/customer/restaurant/[id]` - Trang chi tiết nhà hàng

#### Option 1: Nginx/Apache
- Copy toàn bộ nội dung thư mục `dist` vào web root của server
- Cấu hình server để serve static files

#### Option 2: CDN (Cloudflare, AWS CloudFront, etc.)
- Upload thư mục `dist` lên CDN
- Cấu hình CDN để serve static files

#### Option 3: GitHub Pages, Netlify, Vercel
- Connect repository với hosting service
- Set build command: `npm run build:static`
- Set publish directory: `dist`

## Cấu hình Server

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Apache Configuration Example
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/frontend/dist
    
    # Handle client-side routing
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
    
    # API proxy to backend
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/
    ProxyPassReverse /api/ http://localhost:3000/
</VirtualHost>
```

## Lợi ích của CSR

1. **Giảm tải server**: Server chỉ cần serve static files và API
2. **Tốc độ**: Static files có thể được cache và serve từ CDN
3. **Scalability**: Dễ dàng scale với CDN và multiple servers
4. **Cost**: Tiết kiệm chi phí server resources

## Lưu ý

1. **SEO**: CSR có thể ảnh hưởng đến SEO, nhưng với Next.js 14 và proper meta tags vẫn có thể handle được
2. **Initial Load**: Trang đầu tiên có thể load chậm hơn một chút do phải download JavaScript bundle
3. **API Endpoints**: Đảm bảo backend API endpoints hoạt động đúng với CORS settings

## Environment Variables

Đảm bảo các environment variables được set đúng:
- `NEXT_PUBLIC_API_URL`: URL của backend API
- Các variables khác cần thiết cho ứng dụng
