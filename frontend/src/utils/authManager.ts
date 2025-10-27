export class AuthManager {
  // Clear all authentication cookies (only role-specific, no generic cookies)
  static clearAllAuth() {
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
}
