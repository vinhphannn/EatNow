// API Configuration
export const API_CONFIG = {
  BASE_URL: typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001',
  TIMEOUT: 10000,
} as const;

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
  UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'EatNow',
  DESCRIPTION: 'Nền tảng đặt đồ ăn trực tuyến hàng đầu Việt Nam',
  VERSION: '1.0.0',
} as const;

// Routes Configuration
export const ROUTES = {
  HOME: '/',
  CUSTOMER: '/customer',
  RESTAURANT: '/restaurant',
  DRIVER: '/driver',
  ADMIN: '/admin',
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  RESTAURANT: 'restaurant',
  DRIVER: 'driver',
  ADMIN: 'admin',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
} as const;
