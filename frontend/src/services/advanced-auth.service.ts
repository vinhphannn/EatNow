import { User, UserRole, AuthTokens, LoginCredentials, Permission, ROLE_PERMISSIONS } from '@/types/auth';

class AdvancedAuthService {
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'eatnow_access_token',
    REFRESH_TOKEN: 'eatnow_refresh_token',
    USER_DATA: 'eatnow_user_data',
    TOKEN_EXPIRES: 'eatnow_token_expires',
    REFRESH_EXPIRES: 'eatnow_refresh_expires',
    SESSION_ID: 'eatnow_session_id',
    DEVICE_ID: 'eatnow_device_id',
  };

  private readonly API_ENDPOINTS = {
    LOGIN: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/login`,
    REFRESH: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/refresh`,
    LOGOUT: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/logout`,
    LOGOUT_ALL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/logout-all`,
    PROFILE: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/me`,
    DEVICES: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/devices`,
  };

  private refreshPromise: Promise<AuthTokens> | null = null;
  private isRefreshing = false;
  private deviceId: string;
  private sessionId: string;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.sessionId = this.getOrCreateSessionId();
    this.startTokenRefreshTimer();
    this.setupStorageListener();
  }

  /**
   * Enhanced Login với device tracking
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Mock authentication - thay thế bằng API call thật
      const mockTokens: AuthTokens = {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresAt: Date.now() + 3600000, // 1 hour
      };

      // Mock users database
      const mockUsers = [
        {
          email: 'admin@eatnow.com',
          password: 'admin123',
          user: {
            id: 'admin-001',
            email: 'admin@eatnow.com',
            role: UserRole.ADMIN,
            name: 'Admin User',
            permissions: ROLE_PERMISSIONS[UserRole.ADMIN],
            isActive: true,
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        },
        {
          email: 'restaurant@eatnow.com',
          password: 'restaurant123',
          user: {
            id: 'restaurant-001',
            email: 'restaurant@eatnow.com',
            role: UserRole.RESTAURANT,
            name: 'Nhà hàng ABC',
            permissions: ROLE_PERMISSIONS[UserRole.RESTAURANT],
            isActive: true,
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        },
        {
          email: 'driver@eatnow.com',
          password: 'driver123',
          user: {
            id: 'driver-001',
            email: 'driver@eatnow.com',
            role: UserRole.DRIVER,
            name: 'Tài xế Nguyễn Văn A',
            permissions: ROLE_PERMISSIONS[UserRole.DRIVER],
            isActive: true,
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        },
        {
          email: 'customer@eatnow.com',
          password: 'customer123',
          user: {
            id: 'customer-001',
            email: 'customer@eatnow.com',
            role: UserRole.CUSTOMER,
            name: 'Khách hàng Nguyễn Thị B',
            permissions: ROLE_PERMISSIONS[UserRole.CUSTOMER],
            isActive: true,
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
      ];

      // Find user by credentials
      const foundUser = mockUsers.find(
        u => u.email === credentials.email && u.password === credentials.password
      );

      if (foundUser) {
        this.setTokens(mockTokens);
        this.setUser(foundUser.user);
        this.setSessionId();
        
        // Notify other tabs about login
        this.broadcastAuthState('LOGIN', { user: foundUser.user, tokens: mockTokens });
        
        return { user: foundUser.user, tokens: mockTokens };
      } else {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Đăng nhập thất bại');
    }
  }

  /**
   * Enhanced Logout với device cleanup
   */
  async logout(logoutAllDevices = false): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (logoutAllDevices) {
        // Call logout all devices API
        await this.apiCall(this.API_ENDPOINTS.LOGOUT_ALL, { method: 'POST' });
      } else {
        // Call logout API for current device
        await this.apiCall(this.API_ENDPOINTS.LOGOUT, { 
          method: 'POST',
          body: JSON.stringify({ refreshToken, deviceId: this.deviceId })
        });
      }
      
      this.clearAuthData();
      
      // Notify other tabs about logout
      this.broadcastAuthState('LOGOUT');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API fails, clear local data
      this.clearAuthData();
      this.broadcastAuthState('LOGOUT');
    }
  }

  /**
   * Enhanced Refresh Token với automatic retry
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Mock refresh - thay thế bằng API call thật
      const newTokens: AuthTokens = {
        accessToken: 'refreshed-access-token-' + Date.now(),
        refreshToken: 'refreshed-refresh-token-' + Date.now(),
        expiresAt: Date.now() + 3600000, // 1 hour
      };

      this.setTokens(newTokens);
      
      // Notify other tabs about token refresh
      this.broadcastAuthState('TOKEN_REFRESH', { tokens: newTokens });
      
      return newTokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      this.broadcastAuthState('LOGOUT');
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Multi-device session management
   */
  async getActiveDevices(): Promise<any[]> {
    try {
      const response = await this.apiCall(this.API_ENDPOINTS.DEVICES, { method: 'GET' });
      return response.devices || [];
    } catch (error) {
      console.error('Failed to get active devices:', error);
      return [];
    }
  }

  async terminateDevice(deviceId: string): Promise<void> {
    try {
      await this.apiCall(`${this.API_ENDPOINTS.DEVICES}/${deviceId}`, { method: 'DELETE' });
      
      // If terminating current device, logout
      if (deviceId === this.deviceId) {
        await this.logout();
      }
    } catch (error) {
      console.error('Failed to terminate device:', error);
    }
  }

  /**
   * Enhanced Token Management
   */
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRES);
    if (!expiresAt) return true;
    
    // Consider token expired 5 minutes before actual expiration
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= (parseInt(expiresAt) - bufferTime);
  }

  isRefreshTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.STORAGE_KEYS.REFRESH_EXPIRES);
    if (!expiresAt) return true;
    
    return Date.now() >= parseInt(expiresAt);
  }

  /**
   * Auto-refresh timer
   */
  private startTokenRefreshTimer(): void {
    setInterval(async () => {
      if (this.isAuthenticated() && this.isTokenExpired() && !this.isRefreshTokenExpired()) {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Multi-tab synchronization
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('eatnow_')) {
        this.handleStorageChange(e);
      }
    });
  }

  private handleStorageChange(e: StorageEvent): void {
    if (e.key === this.STORAGE_KEYS.ACCESS_TOKEN) {
      if (!e.newValue) {
        // Token was removed (logout)
        this.broadcastAuthState('LOGOUT');
      }
    }
  }

  private broadcastAuthState(action: string, data?: any): void {
    // Broadcast to other tabs via localStorage
    const message = {
      action,
      data,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      sessionId: this.sessionId,
    };
    
    localStorage.setItem('eatnow_broadcast', JSON.stringify(message));
    
    // Clean up broadcast message after a short delay
    setTimeout(() => {
      localStorage.removeItem('eatnow_broadcast');
    }, 100);
  }

  /**
   * Device and Session Management
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem(this.STORAGE_KEYS.SESSION_ID);
    
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, sessionId);
    }
    
    return sessionId;
  }

  private setSessionId(): void {
    this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, this.sessionId);
  }

  /**
   * Enhanced Permission Checking
   */
  hasPermission(user: User | null, permission: Permission): boolean {
    if (!user || !user.isActive) return false;
    return user.permissions.includes(permission);
  }

  hasRole(user: User | null, role: UserRole): boolean {
    return user?.role === role && user?.isActive === true;
  }

  hasAnyRole(user: User | null, roles: UserRole[]): boolean {
    if (!user || !user.isActive) return false;
    return roles.includes(user.role);
  }

  hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    if (!user || !user.isActive) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  }

  hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    if (!user || !user.isActive) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }

  /**
   * Enhanced Authentication State
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getStoredUser();
    return !!(token && user && !this.isRefreshTokenExpired());
  }

  getCurrentUser(): User | null {
    return this.getStoredUser();
  }

  getCurrentTokens(): AuthTokens | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresAt = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRES);
    
    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }
    
    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAt),
    };
  }

  // Private methods for token management
  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRES, tokens.expiresAt.toString());
    
    // Set refresh token expiration (7 days)
    const refreshExpires = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_EXPIRES, refreshExpires.toString());
  }

  private setUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  private getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  private getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRES);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_EXPIRES);
    // Keep device ID and session ID for analytics
  }

  // Utility method for API calls
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAccessToken();
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': this.deviceId,
        'X-Session-ID': this.sessionId,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        try {
          await this.refreshAccessToken();
          // Retry the original request
          return this.apiCall(endpoint, options);
        } catch (error) {
          // Refresh failed, logout user
          this.clearAuthData();
          this.broadcastAuthState('LOGOUT');
          throw new Error('Authentication failed');
        }
      }
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Lazy instantiation to avoid SSR issues
let _advancedAuthService: AdvancedAuthService | null = null;

export const getAdvancedAuthService = (): AdvancedAuthService => {
  if (typeof window === 'undefined') {
    // Return a mock service for SSR
    return {
      login: async () => ({ user: null, tokens: null }),
      logout: async () => {},
      refreshAccessToken: async () => ({ accessToken: '', refreshToken: '', expiresAt: 0 }),
      isAuthenticated: () => false,
      getCurrentUser: () => null,
      getCurrentTokens: () => null,
    } as any;
  }
  
  if (!_advancedAuthService) {
    _advancedAuthService = new AdvancedAuthService();
  }
  
  return _advancedAuthService;
};

export const advancedAuthService = getAdvancedAuthService();
