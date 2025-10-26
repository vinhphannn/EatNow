# PROJECT_CONTEXT.md

## Project Overview
- Full-stack food delivery platform (admin + restaurant + driver + customer).
- Monorepo with:
  - Backend: NestJS + Mongoose/MongoDB (REST APIs, websockets, auth, orders, wallet).
  - Frontend: Next.js (App Router) + React + Tailwind + MUI for admin and consumer UIs.
  - Mobile: Flutter skeleton (very minimal).
- Intended features:
  - Customer: browse categories, featured collections, restaurants, cart, checkout, track orders, notifications.
  - Restaurant: manage menu/items/options, orders, wallet.
  - Driver: accept and fulfill orders, live map/updates.
  - Admin: dashboards, manage users (customers/restaurants/drivers), categories, featured collections, orders, system.

## Tech Stack
- Frontend:
  - Next.js (App Router), React 18
  - Tailwind CSS
  - Material UI (MUI) components for admin and modals
  - FontAwesome icons
  - Custom hooks + Context API for state and auth
- Backend:
  - NestJS (+ Swagger)
  - Mongoose + MongoDB
  - WebSockets gateways (notifications)
  - RESTful APIs, DTO validation (class-validator)
- Build/Tooling:
  - TypeScript across FE/BE
  - Jest config present in backend
  - Node.js + npm
- Mobile:
  - Flutter (placeholder)

## Development Progress

### Completed Features (100%)
1. **Order Management System** ✅
   - Order creation, status tracking, recipient information
   - Restaurant order management with tabbed interface
   - Customer order history and tracking

2. **Smart Order Assignment System** ✅
   - Driver presence tracking with Redis GEO
   - Order queue management with atomic operations
   - Smart assignment algorithm with multi-factor scoring
   - Real-time notifications via Socket.IO
   - Driver API endpoints (accept/reject/complete)
   - Background worker with batch processing

3. **Notification System** ✅
   - Multi-actor notification system (Customer/Restaurant/Driver/Admin)
   - Real-time Socket.IO notifications
   - Database persistence with read/unread tracking

4. **Restaurant Dashboard** ✅
   - Order management with 5-tab interface
   - Today's statistics (orders, revenue)
   - Real-time order updates

5. **Driver Frontend Dashboard** ✅
   - Map interface for order acceptance
   - Order tracking and navigation
   - Location updates
   - Accept/reject/complete order functionality
   - Real-time order management

### System Status: **100% Complete** 🎉
- All core features implemented and integrated
- Frontend and backend fully synchronized
- Real-time notifications working
- Smart order assignment system operational

## Folder Structure & Responsibilities
- `/backend`
  - `src/admin/`: Admin modules
    - `modules/users`: admin users/drivers/restaurants controllers/services
    - `modules/content`: featured-collection schema/dto/service/controller
    - `modules/orders`, `modules/system`: scaffolding
  - `src/auth`: auth controller/service, JwtAuthGuard, DTOs
  - `src/common`: shared controllers (e.g., image upload), schemas, interceptors, utils
  - `src/restaurant`: restaurant domain APIs (menu/items/options/categories, featured collections public endpoint)
  - `src/order`, `src/cart`, `src/payment`, `src/wallet`, `src/driver`, `src/customer`, `src/user`: core business domains
  - `src/notification`: multi-actor notification system with Socket.IO
  - `dist/`: compiled JS

## Data Architecture & Business Rules

### Smart Order Assignment System (Core Feature)
- **Driver Presence Tracking**: Redis GEO spatial indexing for real-time driver location
- **Order Queue Management**: Redis Sorted Sets with atomic operations for order prioritization
- **Smart Assignment Algorithm**: Multi-factor scoring based on distance (40%), performance (35%), workload (25%)
- **Real-time Notifications**: Socket.IO for instant driver notifications and order updates
- **Concurrent Processing**: Batch processing (10 orders/3s) with Redis pipelines for high performance
- **Driver Status Management**: Available/Delivering/Offline states with order tracking

#### Technical Implementation Details
- **Services Created**:
  - `SmartAssignmentService`: Core algorithm for driver selection
  - `DriverPresenceService`: Redis GEO tracking with connection pooling
  - `OrderQueueService`: Atomic queue operations with Lua scripts
  - `AssignmentWorkerService`: Background worker with batch processing
- **API Endpoints**: 
  - `POST /api/v1/driver/orders/accept`: Driver accepts order
  - `POST /api/v1/driver/orders/reject`: Driver rejects order
  - `POST /api/v1/driver/orders/complete`: Driver completes delivery
  - `POST /api/v1/driver/orders/location`: Update driver location
- **Performance Optimizations**:
  - Redis connection pooling with keep-alive
  - Pipeline operations for batch data retrieval
  - Atomic Lua scripts to prevent race conditions
  - 3-second polling interval for fast response
  - 2km radius search with 20 driver limit

### Order Management System
- **Order Creation**: Always use `customerId = userId` (string) for consistency
- **Order Retrieval**: Query by `customerId` directly (no customer lookup needed)
- **Performance**: Direct userId mapping eliminates extra database queries
- **Migration**: Legacy orders migrated from `customer._id` to `userId` format
- **Driver Assignment**: `driverId` defaults to `null`, updated when driver accepts order
- **Contact Information**: 
  - `purchaserPhone`: Required field for order creator
  - `deliveryAddress.recipientName` & `deliveryAddress.recipientPhone`: From saved address
  - Removed secondary phone fields for simplicity

### User & Customer Relationship
- **User**: Authentication entity (login, JWT tokens)
- **Customer**: Profile entity (name, phone, addresses) linked to User via `userId`
- **Orders**: Always reference `userId` as `customerId` for direct access
- **Rationale**: Simplifies queries, improves performance, reduces complexity

### Cart Management
- **Cart Lifecycle**: Create → Add Items → Checkout → Delete (no status field)
- **Cart Storage**: `userId + restaurantId` combination for uniqueness
- **Cart Clearing**: Automatic deletion after successful order placement
- **No Status Tracking**: Eliminates complexity of active/checked_out states

## API Design Guidelines

### Order APIs
- **GET /api/v1/orders/customer**: Returns orders for authenticated user
- **POST /api/v1/orders**: Creates new order from cart
- **PUT /api/v1/orders/:id/status**: Updates order status
- **Authentication**: JWT Bearer token required for all order operations

### Cart APIs
- **GET /api/v1/cart/:restaurantId**: Get cart for specific restaurant
- **POST /api/v1/cart/:restaurantId/items**: Add item to cart
- **DELETE /api/v1/cart/:restaurantId/items/:itemId**: Remove item from cart
- **DELETE /api/v1/cart/:restaurantId**: Clear entire cart

### Data Consistency Rules
1. **Order Creation**: Always use `customerId = userId` (string)
2. **Cart Operations**: Always use `userId` for cart identification
3. **No Mixed References**: Never mix `userId` and `customer._id` in same system
4. **Migration Required**: When changing data structure, migrate existing data
5. **Validation**: Always validate `userId` exists before creating orders/carts
- `/frontend`
  - `src/app`: Next.js routes (admin, customer, restaurant, driver sections)
    - `admin/layout.tsx`: fixed sidebar admin shell with guard
    - `admin/...` pages: dashboard, users, content/categories, content/collections, orders, map, etc.
    - `customer/...` pages: home, login, cart, checkout, orders
    - `restaurant/...` pages: menu, orders, layout
    - `driver/...` pages: current/orders
  - `src/components`: reusable UI (ItemCard, ImageUpload, nav bars, chips, maps)
  - `src/hooks`: data hooks (orders/menu/categories/featured), sockets, auth
  - `src/contexts`: `AuthContext` for session and role logic
  - `src/services`: `api.client.ts` abstraction and feature services
  - `public`: static assets
- `/mobile/eatnow_mobile`: Flutter skeleton
- Root docs: README.md, SETUP.md, DEPLOYMENT.md, API.md

Implicit rules:
- `/components` for reusable UI building blocks.
- `/services` wraps REST calls via a shared `apiClient`.
- `/hooks` encapsulate data fetching and socket behaviors.
- Backend grouped by domain modules; DTOs and schemas per module.

## Code Style Conventions
- TypeScript-first, strict typing on public APIs and DTOs.
- Naming:
  - PascalCase for components/classes (`AdminLayoutContent`, `FeaturedCollectionService`)
  - camelCase for variables/functions (`getFeaturedCollections`, `initializeAuth`)
  - DTOs suffixed with `Dto`
  - Mongoose schema files suffixed with `.schema.ts`
- File naming:
  - Frontend: `.tsx` for React components, App Router pages as `page.tsx`, layouts as `layout.tsx`
  - Backend: `.ts` for controllers/services/dtos/schemas
- State management:
  - React state + custom hooks
  - Context for auth and permissions
  - No Redux detected

## UI / UX Patterns (frontend)
- Tailwind for layout and spacing; MUI components for inputs/modals/cards.
- Admin shell uses fixed sidebar, top bar, scrollable main content.
- Reusable UI: cards, chips, icon buttons with hover states; responsive grids.
- Iconography: FontAwesome via component mapping.

## API & Data Handling
- REST over HTTP using `apiClient` that:
  - Auto-prefixes `/api/v1`
  - Uses `credentials: 'include'` for cookie-based auth
  - Handles 401 redirects to role-specific logins
- Backend exposes NestJS REST controllers per domain with DTO validation and Mongoose models.
- Authentication:
  - Cookie-based session via `/auth/login` issuing `access_token` (HttpOnly)
  - Role cookies (`admin_token` etc.) used by Next middleware to guard routes
  - `/auth/me` protected by JWT guard to get current profile

## Business Logic (Functional Intent)
- Food delivery platform:
  - Categories (admin-managed) and featured collections (admin-defined by main criteria) power customer discovery on `/customer/home`.
  - Item options/choices for restaurant menus with choice pricing.
  - End-to-end order flow: cart -> checkout -> order creation -> driver assignment/updates -> notifications.
  - Admin: oversight dashboards, user management, content management (categories/collections), order monitoring, map view for live entities.
  - Wallet and payments modules integrated for transactions.

---

## AI Development Guidelines

When generating new code:
- Follow the existing structure
- Reuse existing components instead of re-creating new ones
- Match naming conventions
- Avoid introducing new libraries unless explicitly allowed


