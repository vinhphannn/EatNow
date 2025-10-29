# EatNow – Nền tảng giao đồ ăn (Monorepo)

Một hệ thống full‑stack giao đồ ăn (Admin/Restaurant/Driver/Customer) với realtime notification, smart driver assignment, ví điện tử, và dashboard quản trị.

## Tính năng chính
- Quản lý đơn hàng end‑to‑end: giỏ hàng → thanh toán → theo dõi → đánh giá
- Smart driver assignment: Redis GEO + thuật toán chấm điểm đa yếu tố + worker nền
- Realtime notification: Socket.IO cho Customer/Restaurant/Driver/Admin
- Dashboard cho nhà hàng và tài xế (bản đồ, đơn hiện tại, trạng thái)
- Hệ thống ví (Wallet) và giao dịch
- Xác thực theo vai trò bằng cookie (multi‑login cùng máy)

## Production URLs
- Frontend (Vercel): https://eat-now.vercel.app/
- Backend (Render): https://eatnow-wf9h.onrender.com
- Swagger (prod): https://eatnow-wf9h.onrender.com/api
- API base (prod): https://eatnow-wf9h.onrender.com/api/v1

## Kiến trúc & Công nghệ
- Frontend: Next.js (App Router), React 18, Tailwind CSS, MUI, Context/Hooks
- Backend: NestJS, MongoDB (Mongoose), Redis, Socket.IO, Swagger
- Ngôn ngữ: TypeScript toàn bộ FE/BE
- Mobile: Flutter skeleton (tham khảo)

Cấu trúc thư mục chính:
```
backend/     # NestJS APIs, sockets, assignment worker, domain modules
frontend/    # Next.js App Router UI (customer/restaurant/driver/admin)
mobile/      # Flutter skeleton
```

## Yêu cầu hệ thống
- Node.js 18+
- MongoDB
- Redis (khuyến nghị cho assignment realtime)

## Cài đặt nhanh (Local)
### 1) Clone & chuẩn bị
```bash
# Clone repo
git clone <your-repo-url>
cd EatNow
```

### 2) Backend (PORT 3001)
```bash
cd backend
npm install
# Tạo .env từ mẫu và chỉnh kết nối Mongo/Redis, JWT
copy .env.example .env        # Windows (PowerShell/CMD)
# hoặc: cp .env.example .env  # macOS/Linux
npm run start:dev
```
Backend sẽ chạy tại `http://localhost:3001` với prefix `api/v1`.
- Swagger: `http://localhost:3001/api`
- API base: `http://localhost:3001/api/v1`

### 3) Frontend (PORT 3002)
```bash
cd ../frontend
npm install
# Tạo file env cho FE
# Windows PowerShell
"NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" | Out-File -Encoding ASCII .env.local
# macOS/Linux
# echo NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 > .env.local
npm run dev
```
Truy cập web tại: `http://localhost:3002`

## Mô hình xác thực (quan trọng)
Hệ thống dùng cookie theo vai trò (role‑specific), hỗ trợ đăng nhập đồng thời nhiều vai trò trên cùng máy:
- `{role}_access_token`, `{role}_refresh_token`, `{role}_csrf_token`, `{role}_token`
- Vai trò: `customer`, `restaurant`, `driver`, `admin`
- Frontend gọi API với `credentials: 'include'`; không lưu token trong localStorage
- Middleware FE kiểm tra đúng cookie tương ứng role để bảo vệ route

Tham khảo chi tiết: `PROJECT_CONTEXT.md`, `TOKEN_SYSTEM_OVERVIEW.md`.

## API chính
- Base URL: `http://localhost:3001/api/v1`
- Tài liệu: xem `API.md` hoặc Swagger `/api`
- Ví dụ endpoint:
  - Auth: `POST /auth/login`, `GET /auth/me`
  - Cart: `GET /cart/:restaurantId`, `POST /cart/:restaurantId/items`
  - Orders: `POST /orders`, `GET /orders/customer`, `PUT /orders/:id/status`
  - Driver: `POST /driver/orders/accept`, `POST /driver/orders/location`

## Smart Driver Assignment (tóm tắt)
- Redis GEO để theo dõi vị trí tài xế realtime
- Hàng đợi đơn hàng bằng Sorted Sets + Lua scripts (atomic)
- Worker nền xử lý theo lô (mỗi ~3s), thông báo Realtime tới tài xế
- Chấm điểm theo: khoảng cách, hiệu suất, khối lượng công việc

## Ví (Wallet) & Thanh toán (Payment)
- Multi‑actor wallet: customer/restaurant/driver/admin (system wallet)
- Escrow flow: tiền khách → escrow platform → phân phối khi delivered
- Transaction types: deposit, withdraw, order_payment, order_revenue, commission, platform_fee, refund, transfer, fee
- Tích hợp MoMo: deposit/payment + callback, bảo đảm idempotency
- Ẩn platform fee với user/restaurant; admin xem đầy đủ

Tài liệu chi tiết:
- `backend/README_WALLET_PAYMENT.md`
- `backend/src/wallet/WALLET_SCHEMA_GUIDE.md`
- `backend/docs/WALLET_PAYMENT_API.md`, `PAYMENT_INTEGRATION.md`, `WALLET_PAYMENT_COMPLETE.md`, `TESTING_GUIDE.md`

## Realtime Notifications
- Collection `Notification`: new_order, order_status, payment, delivery, system
- REST endpoints: lấy thông báo, đánh dấu đã đọc, xóa
- Socket.IO events: `new_notification:v1`, `notification_update:v1`, room theo `restaurant:{id}`

Tài liệu: `NOTIFICATION_API.md`

## Frontend Structure Overview
- App Router routes:
  - `admin/`: dashboard, users, content/categories, content/collections, orders, restaurants, drivers, analytics, wallet, settings, security, map
  - `customer/`: home, search, restaurants/[id], restaurant/[id], cart, checkout, orders, profile, address, promotions, wallet, dashboard
  - `driver/`: dashboard, current, orders, earnings, history, wallet, profile, register, login
  - `restaurant/`: dashboard, orders, menu, notifications, analytics, customers, promotions, reviews, stats, wallet, profile, register, login
- Components chính: nav bars, layouts, notifications, bản đồ `map/DriverLiveMap`, UI chip/status, Item options builder/display, upload hình ảnh
- Contexts: `AuthContext`, `AdvancedAuthContext`, `DeliveryAddressContext`
- Hooks: `useCustomerAuth`, `useRestaurantAuth`, `useDriverAuth`, `useRoleAuth`, `useOrderPlacement`, `useMyActiveOrders`, `useSocket`, `useSocketDriver`, `useRestaurantUpdates`, `useRestaurants`, `useMenu`, `useCategories`
- Services (REST wrapper): `api.client.ts`, `auth.service.ts`, `orders.service.ts`, `cart.service.ts`, `notification.service.ts`, `wallet.service.ts`, `restaurant.service.ts`, `menu.service.ts`, `category.service.ts`

## Backend Modules Overview
- Auth, User, Customer, Restaurant, Driver, Order (kèm services: creation, queue, assignment worker, pricing, realtime), Cart, Wallet, Payment (MoMo), Notification (optimized gateway + REST), Category, Search, Admin, Common (ảnh, review, favorite, promotion), Database (Mongo init/seed), Health, Test
- Global cấu hình: `app.module.ts`, `main.ts` (CORS, cookie parser, ValidationPipe, Swagger, global prefix)

## Scripts hữu ích (backend)
- `npm run start:dev` – chạy dev với TS
- Các script kiểm thử/giả lập: xem thư mục `backend/*.js`, `backend/scripts/`

## Biến môi trường
Backend (`backend/.env`):
```
# Local
PORT=3001
MONGODB_URI=mongodb://localhost:27017/eatnow
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3002

# Production (Render)
NODE_ENV=production
PORT=3001
MONGODB_URI=your-mongodb-atlas-uri
REDIS_URL=your-redis-url
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
# Cho Vercel FE
CORS_ORIGIN=https://eat-now.vercel.app
```
Frontend (`frontend/.env.local`):
```
# Local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Production (Vercel → Render backend)
NEXT_PUBLIC_API_URL=https://eatnow-wf9h.onrender.com/api/v1
# (Tuỳ chọn) nếu dùng websocket riêng:
# NEXT_PUBLIC_WS_URL=wss://eatnow-wf9h.onrender.com
```
Thanh toán MoMo (backend):
```
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_REDIRECT_URL=https://eat-now.vercel.app/wallet/success
MOMO_IPN_URL=https://eatnow-wf9h.onrender.com/api/v1/payment/momo/callback
MOMO_ENV=production # hoặc 'test' tuỳ môi trường
```

Ghi chú cookie/CORS khi deploy:
- Dùng `credentials: 'include'` ở FE; backend bật CORS với origin Vercel
- Ở production, cookie nên đặt `SameSite=None; Secure`
- Kiểm tra domain/path cookie trùng khớp FE/BE

## Triển khai (Deployment)
- Frontend (Vercel/Netlify): đặt `NEXT_PUBLIC_API_URL`, build `npm run build`
- Backend (Render/Railway): build `npm run build`, start `npm run start`, cấu hình `MONGODB_URI`, `REDIS_URL`, JWT
- Docker Compose: dịch vụ backend, frontend, mongo, redis (tham khảo trong `DEPLOYMENT.md`)

Xem hướng dẫn chi tiết: `DEPLOYMENT.md`

## Bảo mật & Hiệu năng
- Bảo mật: HttpOnly cookies, SameSite, HTTPS (prod), validate DTO, rate limiting (khuyến nghị), CORS theo domain
- Hiệu năng: Redis pooling, pipeline, index Mongo, batch worker, gzip/caching (khuyến nghị)
- Giám sát: health check `/health`, structured logging, error monitoring

## Troubleshooting
- MongoDB/Redis không chạy: khởi động dịch vụ, kiểm tra URI trong `.env`
- CORS/Cookie không gửi: `credentials: 'include'` ở FE và `CORS_ORIGIN` đúng; kiểm tra SameSite/HTTPS
- 401 sau đăng nhập: kiểm tra cookie theo role được set đúng domain/path; xem middleware
- Payment callback không nhận: kiểm tra IPN URL, SSL, chữ ký, logs tại `POST /payment/momo/callback`
- Không phân phối thu nhập: đảm bảo order = delivered; kiểm tra `distributeOrderEarnings`

## Tài liệu tham khảo trong repo
- `SETUP.md` – hướng dẫn cài đặt chi tiết
- `API.md` – mô tả endpoint
- `PROJECT_CONTEXT.md` – kiến trúc tổng thể, quy ước, best practices
- `ENHANCED_ORDER_SCHEMA.md` – schema đơn hàng mở rộng & migration
- `TOKEN_SYSTEM_OVERVIEW.md` – hệ thống cookie theo vai trò
- `NOTIFICATION_API.md` – realtime notifications
- `backend/README_WALLET_PAYMENT.md` – ví & thanh toán
- `backend/docs/*` – tài liệu tích hợp/thử nghiệm payment & wallet
- `DEPLOYMENT.md` – triển khai (PaaS, Docker, Env)

## Định hướng đóng góp
- Tuân theo cấu trúc module: `models`, `controllers`, `services`, `routes`, `utils`
- Logic nghiệp vụ đặt tại service layer; controller chỉ làm nhiệm vụ điều phối
- Không thêm thư viện nếu có thể tái sử dụng thư viện sẵn có
- Viết TypeScript rõ ràng, DTO/Schema tường minh, RESTful chuẩn

---
Nếu bạn cần mình hướng dẫn chi tiết theo vai trò (VD: quy trình test end‑to‑end Customer → Restaurant → Driver) hoặc viết script seed nhanh, hãy mở issue/trao đổi để mình bổ sung.
