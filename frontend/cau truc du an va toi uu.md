I'll scan key project files in parallel to understand the architecture, FE/BE sync, scripts, and API usage, then propose an optimization plan.

[15 tools called]

### Trạng thái

Mình đã quét nhanh cấu trúc FE/BE, các guide, file env và một số service chính (auth, cart). Mình sẽ nêu rõ các điểm lệch, đề xuất chuẩn hóa, và một lộ trình refactor/rebuild tối ưu.

### Đánh giá tổng quan

- Backend: NestJS module hóa tốt, có `Auth/User/Restaurant/Order/Cart/...`, dùng `helmet`, `schedule`, Mongo via `@nestjs/mongoose` + TypeORM/PG (cần xác nhận dùng cái nào chính). Cấu trúc ổn, dễ mở rộng.
- Frontend: Next.js App Router, nhiều route/actor, docs auth khá kỹ nhưng code thật còn mock/lưu token ở localStorage, middleware bảo vệ route đang tắt. Tổ chức thư mục hơi rời rạc theo kỹ thuật thay vì theo domain.

### Các vấn đề cần đồng bộ/chuẩn hóa ngay

- API base URL/đường dẫn:
  - `ENVIRONMENT.md`: `NEXT_PUBLIC_API_URL=http://localhost:3000`.
  - `README.md`: hướng dẫn `NEXT_PUBLIC_API_BASE_URL`.
  - `API_MAPPING.md`: định hướng versioning `/api/v1/`.
  - `auth.service.ts`: hardcode `http://localhost:3000/auth/...` (thiếu prefix `/api`), không dùng env.
  - `cart.service.ts`: vừa gọi `apiService` (không thấy file `services/api.ts`), vừa gọi fetch với `process.env.NEXT_PUBLIC_API_URL`.
    => Không thống nhất tên biến env, không thống nhất prefix `/api`/`/api/v1`, và trộn nhiều client.
- FE Auth:
  - Token lưu `localStorage`, `middleware.ts` bị disable → route không thực sự được bảo vệ server-side.
  - Refresh token đang mock, chưa gọi API thật.
- FE services lẫn lộn:
  - Có `auth.service.ts`, `cart.service.ts` nhưng thiếu một HTTP client chung (interceptor, retry, refresh).
  - Interface/types phân tán, chưa sync từ BE (OpenAPI/Swagger).
- BE data:
  - `@nestjs/typeorm` và `@nestjs/mongoose` cùng tồn tại; `API_MAPPING.md` nói Mongo là chính. Cần chốt một nguồn dữ liệu chính để giảm độ phức tạp.
- Versioning:
  - Doc nói `/api/v1`, nhưng code FE gọi `/auth/*` trực tiếp. Cần prefix thống nhất (`/api/v1`) cho toàn bộ.

### Đề xuất kiến trúc/ quản lý code tốt hơn

- Chuẩn hóa API layer (FE):
  - Dùng 1 biến duy nhất: `NEXT_PUBLIC_API_URL` (ví dụ `http://localhost:3000/api/v1`).
  - Tạo `services/http.ts` (axios) với:
    - `baseURL` từ env, `withCredentials` nếu dùng cookie.
    - Interceptors: gắn token, auto-refresh 401 một lần, mapping lỗi thống nhất.
  - Tách API theo domain: `services/auth.api.ts`, `cart.api.ts`, `order.api.ts`…; các `*.service.ts` chỉ dùng API client và đóng gói logic nhẹ.
- Domain-driven folder (FE):
  - `src/modules/{auth,restaurant,cart,order,driver,admin}/` gồm `components/`, `pages/`, `api/`, `hooks/`, `types/`.
  - Shared: `src/shared/{components,lib,types}`, `src/config`, `src/store`.
  - Điều này giảm “rối” vì mỗi module tự chứa phần của mình.
- Đồng bộ type giữa BE/FE:
  - Bật Swagger trên BE (đã có `@nestjs/swagger`) → generate SDK/TypeScript types vào package nội bộ `shared-types` (pnpm workspaces) hoặc `frontend/src/types/generated` bằng OpenAPI Generator. Tránh lệch contract.
- Auth & bảo mật tối ưu:
  - Ưu tiên cookie HttpOnly + SameSite=Lax (FE không giữ token), bật lại `middleware.ts` để check cookie theo matcher.
  - BE: refresh token rotation, revoke theo device/session, rate limit, CORS chuẩn nguồn, Helmet đã có.
  - Nếu tạm thời giữ Bearer token: vẫn để interceptor FE auto-refresh, 1 retry tối đa; hạn chế lưu thông tin nhạy cảm.
- Versioning:
  - Chuẩn hóa route BE: mọi controller dưới `/api/v1/...`.
  - FE chỉ build URL dựa trên `NEXT_PUBLIC_API_URL` (đã bao gồm `/api/v1`).
- Giảm tải server:
  - FE: Next App Router dùng SSR chọn lọc + ISR/SSG cho trang public (home, danh sách nhà hàng, menu), React Query với cache staleTime hợp lý, prefetch, pagination/infinite-query, debounce search, skeleton.
  - CDN cho ảnh (Cloudinary đã set up), Next Image.
  - BE: bật caching Redis cho listing, detail ít thay đổi, ETag/Last-Modified, phân trang mọi danh sách, rate limit auth endpoints, queue job cho task nặng.
  - Realtime: chỉ WebSocket nơi cần (đơn hàng theo nhà hàng/tài xế), còn lại polling chậm hoặc SSE nếu phù hợp.
- Tooling/ chất lượng:
  - pnpm workspaces ở root: `backend`, `frontend`, `shared` (types/SDK).
  - ESLint/Prettier thống nhất, path alias (`@/modules/...`).
  - `.env` chuẩn tên: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`. Xóa các biến trùng tên cũ.
- CI/CD:
  - Lint + type-check + test ngắn; build BE/FE; chạy e2e smoke (auth + một flow cart).

### Các việc cụ thể nên làm (ưu tiên)

- BE
  - Đặt global prefix `/api/v1` và bật Swagger chuẩn; chốt DB chính (Mongo hoặc Postgres).
  - Đồng bộ CORS theo FE, rate limit, refresh token endpoints thật.
- FE
  - Tạo `services/http.ts` và chuyển tất cả service dùng client chung.
  - Sửa `auth.service.ts` dùng env, bỏ hardcode URL; thực thi refresh token thật.
  - Sửa `cart.service.ts` dùng API client; tạo rõ `cart.api.ts`. Loại bỏ phụ thuộc `apiService` nếu không tồn tại.
  - Bật lại `middleware.ts` (nếu chuyển sang cookie); nếu vẫn Bearer, dùng client side guards + server components hạn chế dữ liệu.
  - Chuẩn hóa `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`.
  - Tái cấu trúc FE theo modules/domain.
- Đồng bộ types
  - Generate types từ Swagger vào `frontend/src/types/generated` hoặc `shared/types`.

### Điểm cần lưu ý từ code hiện tại

- `frontend/src/services/auth.service.ts`: hardcode `http://localhost:3000/auth/...`, lưu token localStorage, refresh mock.
- `frontend/src/services/cart.service.ts`: trộn `apiService` (thiếu file) và fetch thẳng tới `${NEXT_PUBLIC_API_URL}/cart` (không prefix `/api/v1` như doc), cần hợp nhất.
- `frontend/src/middleware.ts`: đang tắt guard toàn bộ → rủi ro truy cập không kiểm soát phía server.
- `ENVIRONMENT.md` vs `README.md`: tên biến env và giá trị khác nhau; chọn một chuẩn duy nhất.
- `API_MAPPING.md`: định nghĩa versioning và contract rõ → nên lấy đây làm source of truth.

### Kế hoạch rebuild gọn nhẹ, hiệu năng cao

- Phase 1 (1–2 ngày): Chuẩn hóa env + API base, thêm global prefix BE, tạo HTTP client + migrate auth/cart services, bật Swagger.
- Phase 2 (2–3 ngày): Generate types từ Swagger, refactor FE theo modules, bật React Query, áp ISR cho trang public.
- Phase 3 (2–3 ngày): Áp dụng cookie HttpOnly, bật middleware bảo vệ, hoàn thiện refresh token rotation, Redis cache endpoints phổ biến.
- Phase 4: Tối ưu ảnh, CDN, phân trang tất cả list, quan trắc Sentry/Log.

Nếu bạn muốn, mình có thể bắt đầu bằng việc:

- Tạo `frontend/src/services/http.ts` + sửa `auth.service.ts`/`cart.service.ts` dùng env và client chung.
- Chuẩn hóa `.env.local` và cập nhật `middleware.ts` theo hướng bạn chọn (cookie hoặc Bearer).
- Tóm tắt thay đổi đề xuất

  - Chuẩn hóa env + base URL và versioning `/api/v1`.
  - Tạo HTTP client chung có interceptors/refresh.
  - Refactor FE theo domain modules; dùng React Query + ISR/SSG.
  - Dùng cookie HttpOnly + middleware SSR guard, hoặc chuẩn hóa Bearer với guard client.
  - Generate types từ Swagger để đồng bộ FE/BE.
  - BE bật cache Redis, rate limit, pagination, CDN ảnh.
