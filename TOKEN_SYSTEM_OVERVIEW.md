# 🔐 EatNow Token System Overview (Updated)

## 📋 **Tổng quan hệ thống Authentication**

EatNow sử dụng **Role-Specific Cookie-based Authentication** với JWT tokens riêng biệt cho từng role để tránh nhầm lẫn khi cùng một máy đăng nhập nhiều actor khác nhau.

## 🍪 **Cookie Architecture (Updated)**

### **1. Role-Specific Authentication Cookies (Backend tự động tạo)**

#### **Access Tokens (JWT chính):**
- `customer_access_token` - JWT cho customer
- `restaurant_access_token` - JWT cho restaurant  
- `driver_access_token` - JWT cho driver
- `admin_access_token` - JWT cho admin

#### **Refresh Tokens:**
- `customer_refresh_token` - Refresh token cho customer
- `restaurant_refresh_token` - Refresh token cho restaurant
- `driver_refresh_token` - Refresh token cho driver
- `admin_refresh_token` - Refresh token cho admin

#### **CSRF Tokens:**
- `customer_csrf_token` - CSRF cho customer
- `restaurant_csrf_token` - CSRF cho restaurant
- `driver_csrf_token` - CSRF cho driver
- `admin_csrf_token` - CSRF cho admin

### **2. Role Indicator Cookies (Frontend middleware sử dụng):**
- `customer_token` - Chỉ chứa "1" để middleware biết user là customer
- `restaurant_token` - Chỉ chứa "1" để middleware biết user là restaurant
- `driver_token` - Chỉ chứa "1" để middleware biết user là driver
- `admin_token` - Chỉ chứa "1" để middleware biết user là admin

## 🔄 **Authentication Flow (Updated)**

### **Login Process:**
1. User đăng nhập → Backend tạo JWT
2. Backend set **CHỈ** role-specific cookies:
   - `{role}_access_token` - JWT chính
   - `{role}_refresh_token` - Refresh token
   - `{role}_csrf_token` - CSRF token
   - `{role}_token = "1"` - Role indicator
3. Frontend nhận user data và lưu vào AuthContext

### **Request Authentication:**
1. **JWT Guard** kiểm tra token theo thứ tự:
   - Authorization header (Bearer token)
   - Role-specific cookies (`customer_access_token`, `restaurant_access_token`, etc.)
2. **Middleware** kiểm tra:
   - `{role}_access_token` (JWT chính cho role đó)
   - `{role}_token` (role indicator)

### **Logout Process:**
1. Frontend gọi `/api/v1/auth/logout`
2. Backend clear tất cả role-specific cookies
3. Frontend clear **TẤT CẢ** role-specific cookies
4. AuthContext clear user state
5. Middleware redirect về login

## 🛡️ **Security Features (Updated)**

### **Cookie Security:**
- **HttpOnly**: Ngăn JavaScript truy cập (trừ CSRF tokens)
- **SameSite**: Ngăn CSRF attacks
- **Secure**: HTTPS only (production)
- **Path restrictions**: Giới hạn scope

### **Role Isolation:**
- **Mỗi role có token riêng**: Không có generic `access_token`
- **Không nhầm lẫn**: Customer và Driver có thể đăng nhập cùng lúc
- **Middleware kiểm tra chính xác**: Chỉ kiểm tra token của role tương ứng

## 📊 **Cookie Usage Matrix (Updated)**

| Cookie Type | Backend Sets | Frontend Uses | Purpose |
|-------------|--------------|---------------|---------|
| `{role}_access_token` | ✅ | ❌ | Role-specific JWT authentication |
| `{role}_refresh_token` | ✅ | ❌ | Role-specific token refresh |
| `{role}_csrf_token` | ✅ | ❌ | Role-specific CSRF protection |
| `{role}_token` | ✅ | ✅ | Middleware role detection |

## 🔧 **Frontend Token Management (Updated)**

### **AuthService:**
- `login()`: Gọi API, không lưu token (cookies tự động)
- `logout()`: Clear tất cả role-specific cookies
- `getCurrentUser()`: Gọi `/api/v1/auth/me` với cookies

### **AuthContext:**
- Lưu user data (không lưu tokens)
- Tự động check auth state khi mount
- Refresh state sau logout

### **Middleware:**
- Kiểm tra `{role}_access_token` + `{role}_token`
- Redirect nếu thiếu cookies của role tương ứng

## 🚨 **Important Notes (Updated)**

### **Không có generic tokens:**
- Loại bỏ hoàn toàn `access_token`, `refresh_token`, `csrf_token` chung
- Chỉ sử dụng role-specific tokens
- Tránh nhầm lẫn giữa các roles

### **Multi-role Support:**
- Cùng một máy có thể đăng nhập nhiều roles
- Mỗi role có cookies riêng biệt
- Middleware kiểm tra chính xác role tương ứng

### **Cookie Clearing Strategy:**
- Clear với nhiều paths: `/`, `/auth`, `/driver/`, `/admin/`, `/restaurant/`, `/customer/`
- Clear với nhiều SameSite settings: Lax, Strict, None
- Clear tất cả role-specific cookies

## 🎯 **Best Practices (Updated)**

1. **Luôn sử dụng `authService.logout()`** thay vì clear cookies thủ công
2. **Không lưu tokens trong localStorage/sessionStorage**
3. **Kiểm tra đúng role-specific cookies** trong middleware
4. **Clear cookies với nhiều paths và SameSite settings**
5. **Sử dụng `window.location.href`** để force reload sau logout

## 🔍 **Debugging Tips (Updated)**

### **Kiểm tra cookies theo role:**
```javascript
// Trong browser console
document.cookie.split(';').forEach(c => {
  if (c.includes('_access_token') || c.includes('_token')) {
    console.log(c.trim());
  }
});
```

### **Kiểm tra auth state:**
```javascript
// Trong React component
const { user, isAuthenticated } = useAuth();
console.log({ user, isAuthenticated });
```

### **Kiểm tra API calls:**
```javascript
// Kiểm tra cookies được gửi
fetch('/api/v1/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

## 🎉 **Benefits of Role-Specific Tokens**

1. **Không nhầm lẫn**: Mỗi role có token riêng
2. **Multi-login**: Cùng máy có thể đăng nhập nhiều roles
3. **Bảo mật cao**: Không có token chung
4. **Dễ debug**: Biết chính xác role nào đang active
5. **Tương thích**: Hoạt động tốt với middleware

---

**Tóm lại**: EatNow sử dụng hệ thống role-specific cookie-based authentication, mỗi role có tokens riêng biệt để tránh nhầm lẫn và hỗ trợ multi-login trên cùng một máy.
