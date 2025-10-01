# EatNow API Mapping Guide (MongoDB)

## Tổng quan

Tài liệu này mapping các mock data hiện tại với API endpoints thật để thay thế dữ liệu giả bằng dữ liệu thật từ **MongoDB database** với 23 collections.

---

## Restaurant Dashboard APIs

### 1. Restaurant Statistics

**Mock Data Location:** `frontend/src/app/restaurant/dashboard/page.tsx`
```typescript
const [stats, setStats] = useState({
  todayOrders: 24,
  todayRevenue: 2400000,
  pendingOrders: 5,
  totalMenuItems: 45,
  averageRating: 4.8,
  totalReviews: 156,
  monthlyOrders: 720,
  monthlyRevenue: 72000000,
  completionRate: 98.5,
  avgPreparationTime: 15
});
```

**API Endpoints:**
```typescript
// GET /api/restaurants/{restaurantId}/stats/dashboard
interface RestaurantDashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalMenuItems: number;
  averageRating: number;
  totalReviews: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  completionRate: number;
  avgPreparationTime: number;
}

// GET /api/restaurants/{restaurantId}/stats/orders?period=today
// GET /api/restaurants/{restaurantId}/stats/orders?period=month
// GET /api/restaurants/{restaurantId}/stats/revenue?period=today
// GET /api/restaurants/{restaurantId}/stats/revenue?period=month
```

### 2. Recent Orders

**Mock Data Location:** `frontend/src/app/restaurant/dashboard/page.tsx`
```typescript
const [recentOrders, setRecentOrders] = useState([
  {
    id: "ORD-001",
    customer: "Nguyễn Văn A",
    items: ["Cơm tấm sườn nướng", "Trà đá"],
    total: 45000,
    status: "preparing",
    time: "5 phút trước"
  },
  // ...
]);
```

**API Endpoints:**
```typescript
// GET /api/restaurants/{restaurantId}/orders?limit=10&status=all
interface RecentOrder {
  id: string;
  code: string;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime?: string;
}

// GET /api/orders/{orderId} - Chi tiết đơn hàng
```

### 3. Top Selling Items

**Mock Data Location:** `frontend/src/app/restaurant/dashboard/page.tsx`
```typescript
const [topSellingItems, setTopSellingItems] = useState([
  { name: "Cơm tấm sườn nướng", orders: 45, revenue: 2025000 },
  { name: "Bún bò Huế", orders: 38, revenue: 2470000 },
  // ...
]);
```

**API Endpoints:**
```typescript
// GET /api/restaurants/{restaurantId}/stats/items/popular?limit=5&period=month
interface TopSellingItem {
  itemId: string;
  name: string;
  orders: number;
  revenue: number;
  quantity: number;
  averageRating: number;
}

// GET /api/restaurants/{restaurantId}/items/stats - Thống kê tất cả món ăn
```

---

## Restaurant Layout APIs

### 1. Restaurant Info

**Mock Data Location:** `frontend/src/app/restaurant/layout.tsx`
```typescript
const [restaurant, setRestaurant] = useState<any>(null);
const [stats, setStats] = useState<any>(null);
```

**API Endpoints:**
```typescript
// GET /api/restaurants/{restaurantId}
interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  isOpen: boolean;
  isAcceptingOrders: boolean;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  minOrderAmount: number;
  preparationTime: number;
  openTime: string;
  closeTime: string;
  openDays: number[];
}

// GET /api/restaurants/{restaurantId}/stats/summary
interface RestaurantSummaryStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  unreadNotifications: number;
}
```

### 2. User Authentication

**Current Implementation:** `frontend/src/services/auth.service.ts`
```typescript
private readonly API_ENDPOINTS = {
  LOGIN: 'http://localhost:3000/auth/login',
  REFRESH: 'http://localhost:3000/auth/refresh',
  LOGOUT: 'http://localhost:3000/auth/logout',
  PROFILE: 'http://localhost:3000/auth/profile',
};
```

**API Endpoints:**
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    isActive: boolean;
  };
}

// GET /api/auth/profile
// POST /api/auth/refresh
// POST /api/auth/logout
```

---

## Menu Management APIs

### 1. Categories

**API Endpoints:**
```typescript
// GET /api/restaurants/{restaurantId}/categories
interface Category {
  id: string;
  name: string;
  position: number;
  itemCount: number;
}

// POST /api/restaurants/{restaurantId}/categories
// PUT /api/categories/{categoryId}
// DELETE /api/categories/{categoryId}
```

### 2. Menu Items

**API Endpoints:**
```typescript
// GET /api/restaurants/{restaurantId}/items
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: 'food' | 'drink';
  imageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  isActive: boolean;
  position: number;
  rating?: number;
  reviewCount?: number;
  popularityScore: number;
}

// POST /api/restaurants/{restaurantId}/items
// PUT /api/items/{itemId}
// DELETE /api/items/{itemId}
// PUT /api/items/{itemId}/toggle-status
```

---

## Order Management APIs

### 1. Order List

**API Endpoints:**
```typescript
// GET /api/restaurants/{restaurantId}/orders
interface OrderListRequest {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 2. Order Details

**API Endpoints:**
```typescript
// GET /api/orders/{orderId}
interface OrderDetail {
  id: string;
  code: string;
  status: OrderStatus;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  restaurant: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    specialInstructions?: string;
  }>;
  deliveryAddress: {
    label: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    note?: string;
  };
  totals: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
    total: number;
  };
  paymentMethod: 'cash' | 'bank_transfer';
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  trackingHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
    updatedBy: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// PUT /api/orders/{orderId}/status
interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}
```

---

## Customer APIs

### 1. Restaurant List

**API Endpoints:**
```typescript
// GET /api/restaurants
interface RestaurantListRequest {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // km
  sortBy?: 'rating' | 'distance' | 'deliveryTime' | 'deliveryFee';
  sortOrder?: 'asc' | 'desc';
  isOpen?: boolean;
  hasDelivery?: boolean;
  minRating?: number;
}

interface RestaurantListResponse {
  restaurants: Restaurant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 2. Restaurant Menu

**API Endpoints:**
```typescript
// GET /api/restaurants/{restaurantId}/menu
interface RestaurantMenu {
  restaurant: {
    id: string;
    name: string;
    description?: string;
    rating: number;
    reviewCount: number;
    deliveryTime: string;
    deliveryFee: number;
    minOrderAmount: number;
    isOpen: boolean;
  };
  categories: Array<{
    id: string;
    name: string;
    position: number;
    items: MenuItem[];
  }>;
}
```

### 3. Cart Management

**API Endpoints:**
```typescript
// GET /api/cart
interface Cart {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: Array<{
    id: string;
    itemId: string;
    itemName: string;
    itemPrice: number;
    quantity: number;
    subtotal: number;
    specialInstructions?: string;
  }>;
  totals: {
    subtotal: number;
    deliveryFee: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
}

// POST /api/cart/items
// PUT /api/cart/items/{itemId}
// DELETE /api/cart/items/{itemId}
// DELETE /api/cart/clear
```

### 4. Order Placement

**API Endpoints:**
```typescript
// POST /api/orders
interface CreateOrderRequest {
  restaurantId: string;
  items: Array<{
    itemId: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  deliveryAddress: {
    label: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    note?: string;
  };
  paymentMethod: 'cash' | 'bank_transfer';
  specialInstructions?: string;
}

interface CreateOrderResponse {
  order: OrderDetail;
  payment?: {
    id: string;
    status: string;
    paymentUrl?: string;
  };
}
```

---

## Driver APIs

### 1. Driver Dashboard

**API Endpoints:**
```typescript
// GET /api/drivers/{driverId}/dashboard
interface DriverDashboard {
  stats: {
    todayOrders: number;
    todayEarnings: number;
    completedOrders: number;
    rating: number;
    totalDeliveries: number;
    averageDeliveryTime: number;
  };
  recentOrders: Order[];
  performance: {
    onTimeRate: number;
    completionRate: number;
    customerRating: number;
  };
}

// GET /api/drivers/{driverId}/orders
// PUT /api/drivers/{driverId}/status
// PUT /api/drivers/{driverId}/location
```

---

## Notification APIs

### 1. Notifications

**API Endpoints:**
```typescript
// GET /api/notifications
interface Notification {
  id: string;
  title: string;
  body?: string;
  type: 'order' | 'payment' | 'delivery' | 'promotion' | 'system';
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// PUT /api/notifications/{notificationId}/read
// PUT /api/notifications/read-all
// GET /api/notifications/unread-count
```

---

## Implementation Plan

### Phase 1: Authentication & Basic Restaurant Data
1. ✅ Fix authentication flow
2. 🔄 Replace restaurant info API calls
3. 🔄 Replace dashboard stats API calls

### Phase 2: Menu Management
1. 🔄 Replace categories API
2. 🔄 Replace menu items API
3. 🔄 Add CRUD operations for menu

### Phase 3: Order Management
1. 🔄 Replace orders list API
2. 🔄 Replace order details API
3. 🔄 Add order status updates

### Phase 4: Customer Features
1. 🔄 Replace restaurant list API
2. 🔄 Replace cart management API
3. 🔄 Replace order placement API

### Phase 5: Real-time Features
1. 🔄 Add WebSocket for real-time updates
2. 🔄 Add push notifications
3. 🔄 Add location tracking

---

## Error Handling

### Standard Error Response
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  status: number;
}
```

### Common Error Codes
- `AUTH_REQUIRED` - Authentication required
- `AUTH_INVALID` - Invalid credentials
- `PERMISSION_DENIED` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

---

## API Versioning & Base URL

- Frontend MUST use env `NEXT_PUBLIC_API_URL` that already includes version prefix.
- Example (local): `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`
- All backend routes are served under `/api/v1/`.

---

*Cập nhật lần cuối: [Ngày hiện tại]*
*Phiên bản: 1.0*
