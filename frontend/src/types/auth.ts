// Auth Types và Interfaces
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar?: string;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant',
  DRIVER = 'driver',
}

export enum Permission {
  // Admin permissions
  ADMIN_DASHBOARD = 'admin:dashboard',
  ADMIN_USERS = 'admin:users',
  ADMIN_RESTAURANTS = 'admin:restaurants',
  ADMIN_DRIVERS = 'admin:drivers',
  ADMIN_ORDERS = 'admin:orders',
  ADMIN_ANALYTICS = 'admin:analytics',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_VOUCHERS = 'admin:vouchers',
  
  // Customer permissions
  CUSTOMER_ORDER = 'customer:order',
  CUSTOMER_PROFILE = 'customer:profile',
  CUSTOMER_CART = 'customer:cart',
  
  // Restaurant permissions
  RESTAURANT_DASHBOARD = 'restaurant:dashboard',
  RESTAURANT_MENU = 'restaurant:menu',
  RESTAURANT_ORDERS = 'restaurant:orders',
  RESTAURANT_PROFILE = 'restaurant:profile',
  
  // Driver permissions
  DRIVER_DASHBOARD = 'driver:dashboard',
  DRIVER_ORDERS = 'driver:orders',
  DRIVER_PROFILE = 'driver:profile',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  clearError: () => void;
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.ADMIN_DASHBOARD,
    Permission.ADMIN_USERS,
    Permission.ADMIN_RESTAURANTS,
    Permission.ADMIN_DRIVERS,
    Permission.ADMIN_ORDERS,
    Permission.ADMIN_ANALYTICS,
    Permission.ADMIN_SETTINGS,
    Permission.ADMIN_VOUCHERS,
  ],
  [UserRole.CUSTOMER]: [
    Permission.CUSTOMER_ORDER,
    Permission.CUSTOMER_PROFILE,
    Permission.CUSTOMER_CART,
  ],
  [UserRole.RESTAURANT]: [
    Permission.RESTAURANT_DASHBOARD,
    Permission.RESTAURANT_MENU,
    Permission.RESTAURANT_ORDERS,
    Permission.RESTAURANT_PROFILE,
  ],
  [UserRole.DRIVER]: [
    Permission.DRIVER_DASHBOARD,
    Permission.DRIVER_ORDERS,
    Permission.DRIVER_PROFILE,
  ],
};
