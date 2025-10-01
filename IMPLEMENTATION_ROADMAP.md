# EatNow Implementation Roadmap

## 🎯 Mục tiêu
Thay thế toàn bộ mock data bằng dữ liệu thật từ database, đảm bảo ứng dụng hoạt động với dữ liệu thực tế.

## 📋 Tình trạng hiện tại

### ✅ Đã hoàn thành
- [x] Phân tích toàn bộ database schema (23 MongoDB collections)
- [x] Tạo documentation chi tiết (MONGODB_SCHEMA.md)
- [x] Mapping API endpoints (API_MAPPING.md)
- [x] Sửa authentication flow
- [x] Restaurant layout hoạt động

### 🔄 Đang thực hiện
- [ ] Thay thế mock data bằng API thật

### ⏳ Chưa bắt đầu
- [ ] Menu management APIs
- [ ] Order management APIs
- [ ] Customer features APIs
- [ ] Real-time features

---

## 🚀 Kế hoạch triển khai

### Phase 1: Restaurant Dashboard (Ưu tiên cao)
**Timeline: 1-2 ngày**

#### 1.1 Restaurant Info API
```typescript
// Thay thế trong: frontend/src/app/restaurant/layout.tsx
// Từ: Mock data
// Thành: GET /api/restaurants/{restaurantId}
```

#### 1.2 Dashboard Stats API
```typescript
// Thay thế trong: frontend/src/app/restaurant/dashboard/page.tsx
// Từ: useState với data giả
// Thành: GET /api/restaurants/{restaurantId}/stats/dashboard
```

#### 1.3 Recent Orders API
```typescript
// Thay thế trong: frontend/src/app/restaurant/dashboard/page.tsx
// Từ: useState với data giả
// Thành: GET /api/restaurants/{restaurantId}/orders?limit=10
```

#### 1.4 Top Selling Items API
```typescript
// Thay thế trong: frontend/src/app/restaurant/dashboard/page.tsx
// Từ: useState với data giả
// Thành: GET /api/restaurants/{restaurantId}/stats/items/popular?limit=5
```

### Phase 2: Menu Management (Ưu tiên trung bình)
**Timeline: 2-3 ngày**

#### 2.1 Categories Management
- GET /api/restaurants/{restaurantId}/categories
- POST /api/restaurants/{restaurantId}/categories
- PUT /api/categories/{categoryId}
- DELETE /api/categories/{categoryId}

#### 2.2 Menu Items Management
- GET /api/restaurants/{restaurantId}/items
- POST /api/restaurants/{restaurantId}/items
- PUT /api/items/{itemId}
- DELETE /api/items/{itemId}

### Phase 3: Order Management (Ưu tiên cao)
**Timeline: 2-3 ngày**

#### 3.1 Order List
- GET /api/restaurants/{restaurantId}/orders
- Filtering, pagination, sorting

#### 3.2 Order Details & Status Updates
- GET /api/orders/{orderId}
- PUT /api/orders/{orderId}/status

### Phase 4: Customer Features (Ưu tiên trung bình)
**Timeline: 3-4 ngày**

#### 4.1 Restaurant Discovery
- GET /api/restaurants (với search, filter, geolocation)

#### 4.2 Menu Browsing
- GET /api/restaurants/{restaurantId}/menu

#### 4.3 Cart & Order Placement
- GET /api/cart
- POST /api/cart/items
- POST /api/orders

---

## 🛠️ Công việc cụ thể cần làm

### 1. Backend API Development

#### 1.1 Restaurant Stats Controller
```typescript
// backend/src/restaurant/controllers/restaurant-stats.controller.ts
@Controller('restaurants/:id/stats')
export class RestaurantStatsController {
  @Get('dashboard')
  async getDashboardStats(@Param('id') restaurantId: string) {
    // Implementation
  }
  
  @Get('orders/popular')
  async getTopSellingItems(@Param('id') restaurantId: string) {
    // Implementation
  }
}
```

#### 1.2 Order Management Controller
```typescript
// backend/src/order/controllers/order.controller.ts
@Controller('orders')
export class OrderController {
  @Get()
  async getOrders(@Query() query: OrderListQuery) {
    // Implementation
  }
  
  @Put(':id/status')
  async updateOrderStatus(@Param('id') orderId: string, @Body() body: UpdateStatusDto) {
    // Implementation
  }
}
```

### 2. Frontend Service Layer

#### 2.1 Restaurant Service
```typescript
// frontend/src/services/restaurant.service.ts
export class RestaurantService {
  async getDashboardStats(restaurantId: string): Promise<DashboardStats> {
    // Implementation
  }
  
  async getRecentOrders(restaurantId: string, limit: number = 10): Promise<Order[]> {
    // Implementation
  }
}
```

#### 2.2 Order Service
```typescript
// frontend/src/services/order.service.ts
export class OrderService {
  async getOrders(filters: OrderFilters): Promise<OrderListResponse> {
    // Implementation
  }
  
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    // Implementation
  }
}
```

### 3. Database Queries

#### 3.1 Restaurant Stats Queries
```typescript
// Aggregation queries for dashboard stats
const todayStats = await Order.aggregate([
  {
    $match: {
      restaurantId: new ObjectId(restaurantId),
      createdAt: { $gte: startOfToday }
    }
  },
  {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: '$total' }
    }
  }
]);
```

#### 3.2 Popular Items Query
```typescript
// Query for top selling items
const popularItems = await OrderItem.aggregate([
  {
    $match: {
      'order.restaurantId': new ObjectId(restaurantId),
      'order.createdAt': { $gte: startOfMonth }
    }
  },
  {
    $group: {
      _id: '$itemId',
      name: { $first: '$name' },
      totalOrders: { $sum: 1 },
      totalQuantity: { $sum: '$quantity' },
      totalRevenue: { $sum: '$subtotal' }
    }
  },
  { $sort: { totalRevenue: -1 } },
  { $limit: 5 }
]);
```

---

## 📊 Metrics & KPIs

### Performance Metrics
- API response time < 200ms
- Database query time < 100ms
- Page load time < 2s

### Business Metrics
- Order completion rate > 95%
- Restaurant satisfaction > 4.5/5
- Customer retention > 80%

---

## 🔧 Technical Requirements

### Backend
- [ ] Implement proper error handling
- [ ] Add input validation
- [ ] Implement caching strategy
- [ ] Add rate limiting
- [ ] Setup monitoring & logging

### Frontend
- [ ] Add loading states
- [ ] Implement error boundaries
- [ ] Add optimistic updates
- [ ] Implement retry logic
- [ ] Add offline support

### Database
- [ ] Optimize indexes
- [ ] Setup connection pooling
- [ ] Implement backup strategy
- [ ] Monitor query performance

---

## 📝 Notes

### Database Schema Notes
- **MongoDB only** với 23 collections
- Mongoose ODM cho data modeling
- Optimized indexes cho performance
- TTL indexes cho auto-cleanup

### API Design Notes
- RESTful API design
- Consistent error responses
- Proper HTTP status codes
- API versioning strategy

### Frontend Notes
- TypeScript cho type safety
- React Query cho data fetching
- Zustand cho state management
- Error boundaries cho error handling

---

## 🎯 Success Criteria

1. ✅ Restaurant dashboard hiển thị dữ liệu thật
2. ✅ Menu management hoạt động với database
3. ✅ Order management với real-time updates
4. ✅ Customer features hoàn chỉnh
5. ✅ Performance đạt yêu cầu
6. ✅ Error handling robust
7. ✅ User experience smooth

---

*Cập nhật lần cuối: [Ngày hiện tại]*
*Phiên bản: 1.0*
