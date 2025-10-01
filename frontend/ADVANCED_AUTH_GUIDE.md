# 🚀 Advanced Authentication System

## 📋 Tổng quan Advanced Features

Hệ thống authentication đã được nâng cấp với các tính năng enterprise-grade:

### **🔐 Enhanced Security Features**
- ✅ **Multi-device Session Management**: Quản lý nhiều thiết bị đăng nhập
- ✅ **Automatic Token Refresh**: Tự động refresh token trước khi hết hạn
- ✅ **Multi-tab Synchronization**: Đồng bộ auth state giữa các tab
- ✅ **Activity Tracking**: Theo dõi hoạt động user để quản lý session
- ✅ **Device Termination**: Đăng xuất thiết bị từ xa
- ✅ **Session Timeout**: Tự động logout sau thời gian không hoạt động

### **🛡️ Advanced Guards**
- ✅ **RoleGuard**: Multi-role checking với conditional rendering
- ✅ **Advanced PermissionGuard**: Support require ALL/ANY permissions
- ✅ **Conditional Components**: IfRole, IfPermission cho conditional rendering
- ✅ **Custom Unauthorized Components**: Tùy chỉnh UI cho unauthorized access

## 🏗️ Architecture Overview

```
Advanced Authentication System
├── Enhanced Guards Layer
│   ├── RoleGuard (multi-role support)
│   ├── Advanced PermissionGuard (ALL/ANY logic)
│   ├── Conditional Rendering (IfRole, IfPermission)
│   └── Custom Unauthorized Components
├── Advanced Auth Service
│   ├── Multi-device Session Management
│   ├── Automatic Token Refresh
│   ├── Device Tracking & Termination
│   └── Activity Monitoring
├── Advanced Auth Context
│   ├── Multi-tab Synchronization
│   ├── Enhanced State Management
│   ├── Activity Tracking Integration
│   └── Device Management Hooks
├── Device Management
│   ├── DeviceManager Component
│   ├── Active Devices List
│   ├── Device Termination
│   └── Logout All Devices
└── Activity Tracking
    ├── useActivityTracker Hook
    ├── User Activity Monitoring
    ├── Session Timeout Management
    └── Automatic Logout
```

## 🎯 Advanced Guards Usage

### **1. RoleGuard - Multi-role Support**

```typescript
import { RoleGuard } from '@/components/guards/AdvancedGuards';
import { UserRole } from '@/types/auth';

// Require ANY of the specified roles
<RoleGuard requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
  <AdminOrManagerContent />
</RoleGuard>

// Custom unauthorized component
<RoleGuard 
  requiredRoles={[UserRole.ADMIN]}
  customUnauthorizedComponent={<CustomUnauthorizedPage />}
>
  <AdminContent />
</RoleGuard>

// No redirect, just hide content
<RoleGuard 
  requiredRoles={[UserRole.ADMIN]}
  showUnauthorized={false}
>
  <AdminOnlyContent />
</RoleGuard>
```

### **2. Advanced PermissionGuard - ALL/ANY Logic**

```typescript
import { PermissionGuard } from '@/components/guards/AdvancedGuards';
import { Permission } from '@/types/auth';

// Require ANY permission (default)
<PermissionGuard requiredPermissions={[
  Permission.ADMIN_USERS, 
  Permission.ADMIN_RESTAURANTS
]}>
  <AdminContent />
</PermissionGuard>

// Require ALL permissions
<PermissionGuard 
  requiredPermissions={[
    Permission.ADMIN_USERS,
    Permission.ADMIN_RESTAURANTS,
    Permission.ADMIN_DRIVERS
  ]}
  requireAll={true}
>
  <SuperAdminContent />
</PermissionGuard>
```

### **3. Conditional Rendering Components**

```typescript
import { IfRole, IfPermission } from '@/components/guards/AdvancedGuards';

// Conditional rendering based on role
<IfRole roles={[UserRole.ADMIN, UserRole.MANAGER]}>
  <AdminPanel />
</IfRole>

// Conditional rendering based on permission
<IfPermission permissions={[Permission.ADMIN_USERS]}>
  <UserManagementButton />
</IfPermission>

// With fallback content
<IfRole 
  roles={[UserRole.ADMIN]}
  fallback={<div>Bạn cần quyền admin để xem nội dung này</div>}
>
  <AdminDashboard />
</IfRole>
```

### **4. Convenience Guards**

```typescript
import { 
  AdminOrManagerGuard,
  RestaurantOrAdminGuard,
  DriverOrAdminGuard 
} from '@/components/guards/AdvancedGuards';

// Admin or Manager access
<AdminOrManagerGuard>
  <ManagementContent />
</AdminOrManagerGuard>

// Restaurant or Admin access
<RestaurantOrAdminGuard>
  <RestaurantManagement />
</RestaurantOrAdminGuard>

// Driver or Admin access
<DriverOrAdminGuard>
  <DeliveryManagement />
</DriverOrAdminGuard>
```

## 🔄 Refresh Token Flow

### **Automatic Token Refresh**

```typescript
// Service automatically handles token refresh
const authService = new AdvancedAuthService();

// Token is automatically refreshed when:
// 1. Token expires in 5 minutes
// 2. API call returns 401
// 3. Manual refresh is triggered

// Manual refresh
try {
  const newTokens = await authService.refreshAccessToken();
  console.log('Tokens refreshed:', newTokens);
} catch (error) {
  console.error('Refresh failed:', error);
  // User will be logged out automatically
}
```

### **Token Expiration Handling**

```typescript
// Check if token is expired
const isExpired = authService.isTokenExpired();
const isRefreshExpired = authService.isRefreshTokenExpired();

// Automatic refresh timer (runs every minute)
setInterval(async () => {
  if (authService.isAuthenticated() && 
      authService.isTokenExpired() && 
      !authService.isRefreshTokenExpired()) {
    try {
      await authService.refreshAccessToken();
    } catch (error) {
      // Refresh failed, logout user
      authService.logout();
    }
  }
}, 60000);
```

## 🔗 Multi-tab Synchronization

### **Automatic State Sync**

```typescript
// Auth state is automatically synchronized across tabs
// When user logs in/out in one tab, all other tabs are updated

// Listen for auth state changes
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'eatnow_broadcast') {
      const message = JSON.parse(e.newValue || '{}');
      handleAuthMessage(message);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

### **Broadcast Messages**

```typescript
// Auth service broadcasts these events:
// - LOGIN: User logged in
// - LOGOUT: User logged out
// - TOKEN_REFRESH: Tokens refreshed
// - SESSION_EXPIRED: Session expired

// Example broadcast message
{
  action: 'LOGIN',
  data: { user, tokens },
  timestamp: Date.now(),
  deviceId: 'device_123',
  sessionId: 'session_456'
}
```

## 📱 Multi-device Management

### **Device Tracking**

```typescript
// Each device gets unique ID
const deviceId = authService.getDeviceId(); // 'device_1234567890_abc123'
const sessionId = authService.getSessionId(); // 'session_1234567890_xyz789'

// Device information is sent with API calls
headers: {
  'X-Device-ID': deviceId,
  'X-Session-ID': sessionId,
  'Authorization': `Bearer ${token}`
}
```

### **Device Management UI**

```typescript
import { DeviceManager } from '@/components/device/DeviceManager';

// Display all logged-in devices
<DeviceManager />

// Features:
// - List all active devices
// - Show device info (browser, OS, location)
// - Terminate specific device
// - Logout all devices
// - Current device indicator
```

### **Device Operations**

```typescript
import { useAdvancedAuth } from '@/contexts/AdvancedAuthContext';

function DeviceManagement() {
  const { terminateDevice, logoutAllDevices, activeDevices } = useAdvancedAuth();

  // Terminate specific device
  const handleTerminate = async (deviceId: string) => {
    await terminateDevice(deviceId);
  };

  // Logout all devices
  const handleLogoutAll = async () => {
    await logoutAllDevices();
  };

  return (
    <div>
      {activeDevices.map(device => (
        <DeviceCard 
          key={device.id}
          device={device}
          onTerminate={() => handleTerminate(device.id)}
        />
      ))}
    </div>
  );
}
```

## 📊 Activity Tracking

### **useActivityTracker Hook**

```typescript
import { useActivityTracker } from '@/hooks/useActivityTracker';

function MyComponent() {
  const { lastActivity, resetActivity } = useActivityTracker({
    updateInterval: 30000, // Update every 30 seconds
    events: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'],
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    onActivity: () => {
      console.log('User is active');
    },
    onInactivity: () => {
      console.log('User inactive for 30 minutes');
      // Could trigger logout or warning
    },
  });

  return (
    <div>
      <p>Last activity: {new Date(lastActivity).toLocaleString()}</p>
      <button onClick={resetActivity}>Reset Activity</button>
    </div>
  );
}
```

### **Session Timeout Management**

```typescript
// Automatic session timeout
const sessionTimeout = 30 * 60 * 1000; // 30 minutes

useEffect(() => {
  const interval = setInterval(() => {
    if (isAuthenticated && (Date.now() - lastActivity) > sessionTimeout) {
      dispatch({ type: 'SESSION_EXPIRED' });
      authService.logout();
    }
  }, 60000); // Check every minute

  return () => clearInterval(interval);
}, [isAuthenticated, lastActivity, sessionTimeout]);
```

## 🔒 Enhanced Security Features

### **Session Security**

```typescript
// Enhanced token management
const tokens = {
  accessToken: 'jwt-access-token',
  refreshToken: 'jwt-refresh-token',
  expiresAt: Date.now() + 3600000, // 1 hour
};

// Refresh token expiration (7 days)
const refreshExpires = Date.now() + (7 * 24 * 60 * 60 * 1000);

// Token buffer (5 minutes before actual expiration)
const bufferTime = 5 * 60 * 1000;
const isExpired = Date.now() >= (expiresAt - bufferTime);
```

### **Device Security**

```typescript
// Device fingerprinting
const deviceInfo = {
  userAgent: navigator.userAgent,
  screen: `${screen.width}x${screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  platform: navigator.platform,
};

// Location tracking (if permitted)
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  });
}
```

### **API Security**

```typescript
// Enhanced API calls with device info
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
      'X-Session-ID': sessionId,
      'X-Request-ID': generateRequestId(),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // Auto-retry with refreshed token on 401
  if (response.status === 401) {
    await refreshAccessToken();
    return apiCall(endpoint, options); // Retry
  }

  return response.json();
};
```

## 🎨 UI Components

### **Security Settings Page**

```typescript
// Complete security management page
function SecurityPage() {
  const { user, logoutAllDevices } = useAdvancedAuth();
  
  useActivityTracker({
    inactivityTimeout: 30 * 60 * 1000,
    onInactivity: () => {
      // Handle inactivity
    },
  });

  return (
    <div className="security-page">
      <h1>Bảo mật tài khoản</h1>
      
      <DeviceManager />
      
      <SecuritySettings>
        <SettingItem title="Đăng xuất tự động" enabled />
        <SettingItem title="Thông báo đăng nhập" enabled />
        <SettingItem title="Xác thực 2 yếu tố" />
      </SecuritySettings>
      
      <SessionInfo user={user} />
    </div>
  );
}
```

### **Device Card Component**

```typescript
function DeviceCard({ device, onTerminate }) {
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'desktop': return <DesktopIcon />;
      case 'mobile': return <MobileIcon />;
      case 'tablet': return <TabletIcon />;
    }
  };

  return (
    <div className="device-card">
      <div className="device-icon">
        {getDeviceIcon(device.type)}
      </div>
      
      <div className="device-info">
        <h3>{device.name}</h3>
        <p>{device.browser} • {device.os}</p>
        <p>{device.location}</p>
        <p>Hoạt động cuối: {formatLastActive(device.lastActive)}</p>
      </div>
      
      {!device.isCurrent && (
        <button onClick={() => onTerminate(device.id)}>
          Đăng xuất
        </button>
      )}
      
      {device.isCurrent && (
        <span className="current-device">Thiết bị hiện tại</span>
      )}
    </div>
  );
}
```

## 🚀 Production Deployment

### **Environment Variables**

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.eatnow.com
NEXT_PUBLIC_WS_URL=wss://ws.eatnow.com

# Security Settings
NEXT_PUBLIC_TOKEN_BUFFER_TIME=300000
NEXT_PUBLIC_SESSION_TIMEOUT=1800000
NEXT_PUBLIC_REFRESH_INTERVAL=60000

# Feature Flags
NEXT_PUBLIC_ENABLE_DEVICE_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_ACTIVITY_TRACKING=true
NEXT_PUBLIC_ENABLE_MULTI_TAB_SYNC=true
```

### **Performance Optimizations**

```typescript
// Lazy load device manager
const DeviceManager = lazy(() => import('@/components/device/DeviceManager'));

// Memoize expensive calculations
const deviceList = useMemo(() => 
  devices.map(device => ({
    ...device,
    lastActiveFormatted: formatLastActive(device.lastActive)
  }))
, [devices]);

// Debounce activity updates
const debouncedUpdateActivity = useMemo(
  () => debounce(updateActivity, 1000),
  [updateActivity]
);
```

### **Error Handling**

```typescript
// Global error boundary for auth
class AuthErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    if (error.message.includes('Authentication')) {
      return { hasError: true };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error('Auth error:', error, errorInfo);
    // Log to monitoring service
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <AuthErrorFallback />;
    }

    return this.props.children;
  }
}
```

## 🧪 Testing Advanced Features

### **Unit Tests**

```typescript
// Test advanced guards
describe('Advanced Guards', () => {
  it('should render content for multiple roles', () => {
    render(
      <RoleGuard requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
        <TestContent />
      </RoleGuard>
    );
    
    // Mock user with admin role
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should require all permissions when requireAll=true', () => {
    render(
      <PermissionGuard 
        requiredPermissions={[Permission.ADMIN_USERS, Permission.ADMIN_RESTAURANTS]}
        requireAll={true}
      >
        <TestContent />
      </PermissionGuard>
    );
    
    // Mock user with only one permission
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });
});
```

### **Integration Tests**

```typescript
// Test multi-tab synchronization
describe('Multi-tab Sync', () => {
  it('should sync login state across tabs', async () => {
    // Open first tab
    const { user } = render(<LoginPage />);
    
    // Login in first tab
    await user.type(screen.getByPlaceholderText('Email'), 'admin@eatnow.com');
    await user.type(screen.getByPlaceholderText('Password'), 'admin123');
    await user.click(screen.getByText('Đăng nhập'));
    
    // Simulate storage event for second tab
    const storageEvent = new StorageEvent('storage', {
      key: 'eatnow_broadcast',
      newValue: JSON.stringify({
        action: 'LOGIN',
        data: { user: mockUser, tokens: mockTokens }
      })
    });
    
    window.dispatchEvent(storageEvent);
    
    // Verify second tab receives the event
    expect(mockAuthContext.login).toHaveBeenCalled();
  });
});
```

## 📝 Best Practices

### **1. Performance**
- Use `useMemo` for expensive calculations
- Implement proper cleanup in useEffect
- Debounce activity updates
- Lazy load heavy components

### **2. Security**
- Never store sensitive data in localStorage
- Implement proper token rotation
- Use HTTPS in production
- Validate all user inputs

### **3. User Experience**
- Provide clear loading states
- Show meaningful error messages
- Implement graceful fallbacks
- Maintain session state across tabs

### **4. Maintenance**
- Keep components small and focused
- Use TypeScript for type safety
- Implement comprehensive error handling
- Write tests for critical paths

## 🎯 Kết luận

Hệ thống Advanced Authentication cung cấp:

- ✅ **Enterprise-grade Security**: Multi-device management, automatic token refresh
- ✅ **Seamless User Experience**: Multi-tab sync, activity tracking
- ✅ **Flexible Authorization**: Advanced guards với conditional rendering
- ✅ **Production Ready**: Comprehensive error handling, performance optimization
- ✅ **Highly Maintainable**: Clean architecture, extensive documentation

Với hệ thống này, bạn có thể xây dựng ứng dụng food delivery với mức độ bảo mật và trải nghiệm người dùng tương đương các ứng dụng lớn như GrabFood, ShopeeFood.
