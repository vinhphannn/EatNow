import { User, UserRole, AuthTokens, LoginCredentials, Permission, ROLE_PERMISSIONS } from '@/types/auth';

class AuthService {
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'eatnow_token',
    REFRESH_TOKEN: 'eatnow_refresh_token',
    USER_DATA: 'eatnow_user_data',
    TOKEN_EXPIRES: 'eatnow_token_expires',
  };

  // API endpoints
  private readonly API_ENDPOINTS = {
    LOGIN: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/login`,
    REFRESH: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/refresh`,
    LOGOUT: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/logout`,
    PROFILE: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/me`,
  };

       /**
        * Đăng nhập
        */
       async login(credentials: LoginCredentials): Promise<{ user: User }> {
         try {
           // Call real API
           const response = await this.apiCall(this.API_ENDPOINTS.LOGIN, {
             method: 'POST',
             body: JSON.stringify(credentials),
           });

           if (!response.access_token || !response.user) {
             throw new Error('Invalid response from server');
           }

      // Map API response to our User interface
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        name: response.user.name || response.user.fullName || response.user.email,
        permissions: ROLE_PERMISSIONS[response.user.role] || [],
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: response.user.createdAt || new Date().toISOString(),
        updatedAt: response.user.updatedAt || new Date().toISOString(),
      };

      // Cookie-based: do not manage tokens in localStorage
      this.setUser(user);
      return { user };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Đăng nhập thất bại');
    }
  }

  /**
   * Đăng xuất
   */
  async logout(): Promise<void> {
    try {
      await this.apiCall(this.API_ENDPOINTS.LOGOUT, { method: 'POST' });
      this.clearAuthData();
    } catch (error) {
      // Even if API fails, clear local data
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    // Cookie-based refresh would be implemented server-side; no-op here
    throw new Error('Not implemented for cookie-based auth');
  }

  /**
   * Lấy thông tin user hiện tại
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return null;
      }

      const user = this.getStoredUser();
      if (!user) return null;

      // Verify token is still valid
      if (this.isTokenExpired()) {
        try {
          await this.refreshAccessToken();
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          this.clearAuthData();
          return null;
        }
      }

      return user;
    } catch (error) {
      console.error("getCurrentUser error:", error);
      this.clearAuthData();
      return null;
    }
  }

  /**
   * Kiểm tra quyền truy cập
   */
  hasPermission(user: User | null, permission: Permission): boolean {
    if (!user || !user.isActive) return false;
    return user.permissions.includes(permission);
  }

  /**
   * Kiểm tra role
   */
  hasRole(user: User | null, role: UserRole): boolean {
    return user?.role === role && (user?.isActive !== false);
  }

  /**
   * Kiểm tra token còn hiệu lực không
   */
  isTokenExpired(): boolean {
    // Not applicable for cookie-based session on client
    return false;
  }

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const user = this.getStoredUser();
    return !!user;
  }

  // Private methods for token management
  private setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRES, tokens.expiresAt.toString());
  }

  private setUser(user: User): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem(this.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("getStoredUser error:", error);
      return null;
    }
  }

  private clearAuthData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRES);
  }

  // Utility method for API calls
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    
    try {
      const response = await fetch(endpoint, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API call failed: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (fetchError) {
      console.error('API call error:', fetchError);
      throw fetchError;
    }
  }
}

export const authService = new AuthService();
