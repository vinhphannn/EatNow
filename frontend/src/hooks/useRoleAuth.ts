import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'customer' | 'restaurant' | 'driver' | 'admin';

interface UseRoleAuthOptions {
  role: UserRole;
  loginPath: string;
  enableLogging?: boolean;
}

/**
 * Generic role-based authentication hook
 * Replaces individual useCustomerAuth, useDriverAuth, useRestaurantAuth, useAdminAuth hooks
 */
export const useRoleAuth = ({ role, loginPath, enableLogging = false }: UseRoleAuthOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user: contextUser, isAuthenticated: contextIsAuthenticated } = useAuth();

  const log = (message: string, ...args: any[]) => {
    if (enableLogging) {
      console.log(`[${role.toUpperCase()} Auth] ${message}`, ...args);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use context user if available
        if (contextUser && contextUser.role === role) {
          log('User authenticated via context');
          setIsAuthenticated(true);
          setUser(contextUser);
          setLoading(false);
          return;
        }

        // Fallback: check with auth service
        const currentUser = await authService.getCurrentUser();
        
        if (!currentUser || currentUser.role !== role) {
          log('User not authenticated or wrong role');
          setIsAuthenticated(false);
          setUser(null);
          router.push(loginPath);
          return;
        }

        log('User authenticated successfully');
        setIsAuthenticated(true);
        setUser(currentUser);
      } catch (error) {
        log('Auth verification failed:', error);
        setIsAuthenticated(false);
        setUser(null);
        router.push(loginPath);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, contextUser, contextIsAuthenticated, role, loginPath]);

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      router.push(loginPath);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      setIsAuthenticated(false);
      setUser(null);
      router.push(loginPath);
    }
  };

  return { isAuthenticated, user, loading, logout };
};

/**
 * Utility function to get login path for a role
 */
export const getLoginPath = (role: UserRole): string => {
  return `/${role}/login`;
};

/**
 * Utility function to redirect to role-specific login
 */
export const redirectToLogin = (role: UserRole): void => {
  if (typeof window !== 'undefined') {
    window.location.href = getLoginPath(role);
  }
};

/**
 * Utility function to detect role from pathname
 */
export const detectRoleFromPath = (pathname: string): UserRole | null => {
  if (pathname.startsWith('/customer')) return 'customer';
  if (pathname.startsWith('/restaurant')) return 'restaurant';
  if (pathname.startsWith('/driver')) return 'driver';
  if (pathname.startsWith('/admin')) return 'admin';
  return null;
};

/**
 * Utility function to redirect to appropriate login based on current path
 */
export const redirectToAppropriateLogin = (): void => {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname || '';
    const role = detectRoleFromPath(pathname);
    if (role) {
      redirectToLogin(role);
    } else {
      // Default to customer login
      redirectToLogin('customer');
    }
  }
};
