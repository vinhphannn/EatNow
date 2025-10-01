# Hệ thống Authentication theo Role

## Tổng quan
Hệ thống này quản lý authentication riêng biệt cho từng role để tránh nhầm lẫn khi chuyển đổi giữa các tab.

## Cấu trúc

### 1. AuthManager (`/utils/authManager.ts`)
Quản lý tất cả authentication cho các role:
- `setDriverAuth(token, user)` - Lưu auth cho driver
- `getDriverAuth()` - Lấy auth của driver
- `clearDriverAuth()` - Xóa auth của driver
- Tương tự cho customer, restaurant, admin

### 2. Custom Hooks
- `useDriverAuth()` - Hook cho driver
- `useCustomerAuth()` - Hook cho customer  
- `useRestaurantAuth()` - Hook cho restaurant
- `useAdminAuth()` - Hook cho admin

### 3. Local Storage Keys
- Driver: `driver_token`, `driver_user`, `driver_role`
- Customer: `customer_token`, `customer_user`, `customer_role`
- Restaurant: `restaurant_token`, `restaurant_user`, `restaurant_role`
- Admin: `admin_token`, `admin_user`, `admin_role`

## Cách sử dụng

### Đăng nhập
```typescript
// Driver
AuthManager.setDriverAuth(data.access_token, data.user);

// Customer  
AuthManager.setCustomerAuth(data.access_token, data.user);

// Restaurant
AuthManager.setRestaurantAuth(data.access_token, data.user);

// Admin
AuthManager.setAdminAuth(data.access_token, data.user);
```

### Lấy thông tin auth
```typescript
// Driver
const { token, user, role } = AuthManager.getDriverAuth();

// Customer
const { token, user, role } = AuthManager.getCustomerAuth();

// Restaurant
const { token, user, role } = AuthManager.getRestaurantAuth();

// Admin
const { token, user, role } = AuthManager.getAdminAuth();
```

### Logout
```typescript
// Logout role cụ thể
AuthManager.clearDriverAuth();
AuthManager.clearCustomerAuth();
AuthManager.clearRestaurantAuth();
AuthManager.clearAdminAuth();

// Logout tất cả
AuthManager.clearAllAuth();
```

### Sử dụng trong component
```typescript
// Driver component
const { isAuthenticated, user, loading, logout } = useDriverAuth();

// Customer component
const { isAuthenticated, user, loading, logout } = useCustomerAuth();

// Restaurant component
const { isAuthenticated, user, loading, logout } = useRestaurantAuth();

// Admin component
const { isAuthenticated, user, loading, logout } = useAdminAuth();
```

## Lợi ích

1. **Tách biệt hoàn toàn**: Mỗi role có token và user data riêng
2. **Bảo mật cao**: Không bị nhầm lẫn khi chuyển đổi giữa các tab
3. **Dễ quản lý**: Code rõ ràng, dễ maintain
4. **Linh hoạt**: Có thể đăng nhập nhiều role cùng lúc (nếu cần)
5. **Tự động cleanup**: Khi logout role nào thì chỉ xóa data của role đó

## Lưu ý

- Mỗi role chỉ có thể truy cập vào routes của mình
- Middleware sẽ tự động redirect nếu không có token phù hợp
- Khi chuyển đổi giữa các tab, mỗi tab sẽ sử dụng auth riêng của mình
- Không còn bị nhầm lẫn giữa các role
