import { User, UserRole, AuthTokens, LoginCredentials, Permission, ROLE_PERMISSIONS } from '@/types/auth';

class AuthService {
  // Using cookie-based auth only, no localStorage

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

           // Backend now returns user data directly (cookie-based auth)
           // response may be: { id, email, role, name, ... } or { user: { id, email, role, name, ... } }
           const userData = response.user || response;

           if (!userData || !userData.email) {
             throw new Error('Invalid response from server');
           }

      // Map API response to our User interface
      const user: User = {
        id: userData.id || userData._id,
        email: userData.email,
        role: userData.role,
        name: userData.name || userData.fullName || userData.email,
        permissions: ROLE_PERMISSIONS[userData.role] || [],
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      };

      // Cookie-based auth: tokens are in cookies, do not store in localStorage
      // Set role-specific cookie for middleware detection
      if (typeof document !== 'undefined') {
        try {
          const roleCookies = {
            [UserRole.CUSTOMER]: 'customer_token',
            [UserRole.RESTAURANT]: 'restaurant_token',
            [UserRole.DRIVER]: 'driver_token',
            [UserRole.ADMIN]: 'admin_token'
          };
          
          if (roleCookies[user.role]) {
            document.cookie = `${roleCookies[user.role]}=1; path=/; SameSite=Lax; max-age=${60 * 60 * 24}`; // 24 hours
          }
        } catch {}
      }
      
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
    } catch (error) {
      // Ignore API errors during logout
      console.error('Logout API error:', error);
    }
    
    // Clear authentication cookies (only role-specific, no generic cookies)
    if (typeof document !== 'undefined') {
      // Role-specific authentication cookies that backend sets
      const authCookies = [
        // Role-specific access tokens
        'customer_access_token',
        'restaurant_access_token', 
        'driver_access_token',
        'admin_access_token',
        // Role-specific refresh tokens
        'customer_refresh_token',
        'restaurant_refresh_token',
        'driver_refresh_token', 
        'admin_refresh_token',
        // Role-specific CSRF tokens
        'customer_csrf_token',
        'restaurant_csrf_token',
        'driver_csrf_token',
        'admin_csrf_token',
        // Role indicator cookies (for middleware)
        'customer_token',
        'restaurant_token',
        'driver_token', 
        'admin_token'
      ];
      
      // Clear cookies for different paths (backend sets different paths)
      const paths = ['/', '/auth', '/driver/', '/admin/', '/restaurant/', '/customer/'];
      
      authCookies.forEach(cookieName => {
        paths.forEach(path => {
          // Clear with different SameSite settings
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax;`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Strict;`;
        });
      });
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
      // Cookie-based auth: fetch user from server
      const response = await this.apiCall(this.API_ENDPOINTS.PROFILE, { method: 'GET' });
      return response;
    } catch (error) {
      console.error("getCurrentUser error:", error);
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
    // Cookie-based: check if user data exists in context, not localStorage
    return false;
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
