# 🔐 Authentication System Guide

## 📖 Tổng quan

Hệ thống authentication được thiết kế theo kiến trúc layered, tách biệt concerns và dễ dàng maintain/extend.

## 🎯 Các Actor được hỗ trợ

| Actor | Email | Password | Role |
|-------|-------|----------|------|
| Admin | admin@eatnow.com | admin123 | ADMIN |
| Restaurant | restaurant@eatnow.com | restaurant123 | RESTAURANT |
| Driver | driver@eatnow.com | driver123 | DRIVER |
| Customer | customer@eatnow.com | customer123 | CUSTOMER |

## 🏗️ Kiến trúc

### 1. **Types Layer** (`/types/auth.ts`)
- Định nghĩa interfaces, enums, types
- Centralized type definitions
- Role-based permission mapping

### 2. **Service Layer** (`/services/auth.service.ts`)
- Business logic cho authentication
- Token management (access + refresh)
- API integration (mock hiện tại)
- Permission checking

### 3. **Context Layer** (`/contexts/AuthContext.tsx`)
- React Context với useReducer
- State management cho auth
- Convenience hooks cho từng role

### 4. **Guards Layer** (`/components/guards/AuthGuard.tsx`)
- Route protection components
- Role-based và permission-based guards
- Loading states và error handling

## 🚀 Cách sử dụng

### **1. Basic Authentication**

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login({ email: 'admin@eatnow.com', password: 'admin123' });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### **2. Role-based Hooks**

```typescript
import { useAdminAuth, useCustomerAuth, useRestaurantAuth, useDriverAuth } from '@/contexts/AuthContext';

// Admin specific
function AdminComponent() {
  const { isAdmin, canAccessAdmin, user, logout } = useAdminAuth();
  // ...
}

// Customer specific
function CustomerComponent() {
  const { isCustomer, canOrder, user } = useCustomerAuth();
  // ...
}
```

### **3. Route Protection**

```typescript
import { AdminGuard, PermissionGuard } from '@/components/guards/AuthGuard';
import { Permission } from '@/types/auth';

// Protect by role
<AdminGuard>
  <AdminDashboard />
</AdminGuard>

// Protect by permission
<PermissionGuard permission={Permission.ADMIN_USERS}>
  <UsersManagement />
</PermissionGuard>
```

### **4. Permission Checking**

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/auth';

function MyComponent() {
  const { checkPermission, hasRole } = useAuth();
  
  const canManageUsers = checkPermission(Permission.ADMIN_USERS);
  const isAdmin = hasRole(UserRole.ADMIN);
  
  return (
    <div>
      {canManageUsers && <UserManagementButton />}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

## 🔧 Cấu hình

### **1. Thêm Role mới**

```typescript
// types/auth.ts
export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant',
  DRIVER = 'driver',
  MANAGER = 'manager', // Thêm role mới
}

// Thêm permissions cho role mới
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // ... existing roles
  [UserRole.MANAGER]: [
    Permission.MANAGER_DASHBOARD,
    Permission.MANAGER_REPORTS,
  ],
};
```

### **2. Thêm Permission mới**

```typescript
// types/auth.ts
export enum Permission {
  // ... existing permissions
  MANAGER_DASHBOARD = 'manager:dashboard',
  MANAGER_REPORTS = 'manager:reports',
}
```

### **3. Tạo Guard mới**

```typescript
// components/guards/AuthGuard.tsx
export function ManagerGuard({ children, fallbackPath = '/manager/login' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <AuthGuard requiredRole={UserRole.MANAGER} fallbackPath={fallbackPath}>
      {children}
    </AuthGuard>
  );
}
```

## 🎨 UI Components

### **1. Login Forms**
- Consistent design across all actors
- Loading states với spinners
- Error handling với user-friendly messages
- Demo credentials display

### **2. Protected Pages**
- Automatic redirects based on auth state
- Loading screens during auth checks
- User info display
- Logout functionality

### **3. Error Pages**
- Unauthorized access page
- Network error handling
- Fallback routes

## 🔒 Security Features

### **1. Token Management**
- Access token với expiration
- Refresh token mechanism
- Automatic token refresh
- Secure storage in localStorage

### **2. Permission System**
- Granular permissions
- Role-based access control
- Dynamic permission checking
- Fallback to unauthorized page

### **3. Route Protection**
- Component-level guards
- Automatic redirects
- Loading states
- Error boundaries

## 🚀 Production Considerations

### **1. API Integration**
```typescript
// Thay thế mock trong auth.service.ts
private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = this.getAccessToken();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

### **2. Environment Variables**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=EatNow
```

### **3. Error Monitoring**
- Sentry integration
- Error boundaries
- Logging service
- User feedback collection

## 📊 Performance Optimizations

### **1. Code Splitting**
- Lazy loading cho auth guards
- Dynamic imports cho role-specific components
- Route-based splitting

### **2. Caching**
- Token caching với expiration
- User data caching
- Permission caching
- API response caching

### **3. Bundle Size**
- Tree shaking unused permissions
- Dynamic imports
- Compression
- CDN for static assets

## 🧪 Testing

### **1. Unit Tests**
```typescript
// auth.service.test.ts
describe('AuthService', () => {
  it('should login successfully', async () => {
    const result = await authService.login({
      email: 'admin@eatnow.com',
      password: 'admin123'
    });
    
    expect(result.user.role).toBe(UserRole.ADMIN);
    expect(result.tokens.accessToken).toBeDefined();
  });
});
```

### **2. Integration Tests**
```typescript
// auth.integration.test.tsx
describe('Auth Flow', () => {
  it('should redirect to dashboard after login', async () => {
    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'admin@eatnow.com' }
    });
    
    fireEvent.click(screen.getByText('Đăng nhập'));
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/dashboard');
    });
  });
});
```

## 🔄 Migration Guide

### **Từ hệ thống cũ sang mới:**

1. **Thay thế localStorage calls:**
```typescript
// Cũ
const token = localStorage.getItem('eatnow_token');

// Mới
const { tokens } = useAuth();
```

2. **Thay thế manual auth checks:**
```typescript
// Cũ
if (localStorage.getItem('eatnow_role') === 'admin') {
  // show admin content
}

// Mới
<AdminGuard>
  {/* admin content */}
</AdminGuard>
```

3. **Thay thế manual redirects:**
```typescript
// Cũ
useEffect(() => {
  if (!localStorage.getItem('eatnow_token')) {
    router.push('/login');
  }
}, []);

// Mới
<AuthGuard fallbackPath="/login">
  {/* protected content */}
</AuthGuard>
```

## 📝 Best Practices

### **1. Component Design**
- Single responsibility principle
- Composition over inheritance
- Props drilling avoidance
- Type safety first

### **2. State Management**
- Immutable state updates
- Predictable state changes
- Error state handling
- Loading state management

### **3. Security**
- Never store sensitive data in localStorage
- Validate all inputs
- Sanitize user data
- Use HTTPS in production

### **4. Performance**
- Lazy load components
- Memoize expensive calculations
- Avoid unnecessary re-renders
- Use React.memo for pure components

## 🎯 Kết luận

Hệ thống authentication này được thiết kế để:
- ✅ **Scalable**: Dễ dàng thêm roles/permissions mới
- ✅ **Maintainable**: Clean code với separation of concerns
- ✅ **Secure**: Proper token management và validation
- ✅ **User-friendly**: Smooth UX với loading states
- ✅ **Production-ready**: Có thể deploy ngay lập tức

Với kiến trúc này, bạn có thể dễ dàng extend cho các actor mới hoặc thêm tính năng mới mà không ảnh hưởng đến code hiện tại.
