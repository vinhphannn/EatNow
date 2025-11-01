// Barrel exports for all components
export { default as Footer } from './Footer';
export { default as NavBar } from './NavBar';
export { default as OrderNotification } from './OrderNotification';
export { useToast, ToastProvider } from './Toast';

// Image components
export { default as ImageUpload } from './ImageUpload';
export { default as ImageDisplay } from './ImageDisplay';

// Loading components
export { default as LoadingScreen } from './LoadingScreen';
export { default as AppLoadingProvider, useAppLoading } from './AppLoadingProvider';

// Navigation components
export { default as AdminNavBar } from './nav/AdminNavBar';
export { default as CustomerNavBar } from './nav/CustomerNavBar';
export { default as DriverNavBar } from './nav/DriverNavBar';

// Layout components
export { default as BaseLayout } from './layouts/BaseLayout';
export { default as DashboardLayout } from './layouts/DashboardLayout';

// Auth Guards
export { 
  AuthGuard, 
  AdminGuard, 
  CustomerGuard, 
  RestaurantGuard, 
  DriverGuard, 
  PermissionGuard 
} from './guards/AuthGuard';

// Advanced Guards
export {
  RoleGuard,
  PermissionGuard as AdvancedPermissionGuard,
  AdminOrManagerGuard,
  RestaurantOrAdminGuard,
  DriverOrAdminGuard,
  IfRole,
  IfPermission,
  useRoleCheck,
  usePermissionCheck
} from './guards/AdvancedGuards';

// Device Management
export { DeviceManager } from './device/DeviceManager';
export { default as OrderChat } from './order/OrderChat';

// Restaurant components
export { RestaurantCard } from './restaurant/RestaurantCard';