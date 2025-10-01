'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/auth';

// Advanced Guard Props
interface AdvancedGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  fallbackPath?: string;
  showLoading?: boolean;
  showUnauthorized?: boolean;
  customUnauthorizedComponent?: ReactNode;
  onUnauthorized?: () => void;
}

// Multi-role Guard
export function RoleGuard({
  children,
  requiredRoles = [],
  fallbackPath = '/unauthorized',
  showLoading = true,
  showUnauthorized = true,
  customUnauthorizedComponent,
  onUnauthorized,
}: AdvancedGuardProps): JSX.Element | null {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    const checkAuthorization = async () => {
      setIsChecking(true);
      
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        router.push(fallbackPath);
        setIsChecking(false);
        return;
      }

      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.length === 0 || 
        requiredRoles.some(role => hasRole(role));

      if (!hasRequiredRole) {
        setIsAuthorized(false);
        onUnauthorized?.();
        if (!showUnauthorized) {
          router.push(fallbackPath);
        }
      } else {
        setIsAuthorized(true);
      }
      
      setIsChecking(false);
    };

    checkAuthorization();
  }, [isAuthenticated, user, requiredRoles, isLoading, router, fallbackPath, hasRole, showUnauthorized, onUnauthorized]);

  // Show loading spinner while checking
  if (isLoading || isChecking) {
    return showLoading ? (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    ) : null;
  }

  // Show unauthorized component if not authorized
  if (!isAuthorized && showUnauthorized) {
    return (
      <>
        {customUnauthorizedComponent || (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full text-center">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
                <p className="text-gray-600 mb-6">
                  Bạn cần một trong các vai trò sau: {requiredRoles.join(', ')}
                </p>
                <button
                  onClick={() => router.back()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Don't render children if not authorized
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

// Multi-permission Guard
export function PermissionGuard({
  children,
  requiredPermissions = [],
  fallbackPath = '/unauthorized',
  showLoading = true,
  showUnauthorized = true,
  customUnauthorizedComponent,
  onUnauthorized,
  requireAll = false, // true = require ALL permissions, false = require ANY permission
}: AdvancedGuardProps & { requireAll?: boolean }): JSX.Element | null {
  const { isAuthenticated, isLoading, user, checkPermission } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    const checkAuthorization = async () => {
      setIsChecking(true);
      
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        router.push(fallbackPath);
        setIsChecking(false);
        return;
      }

      // Check permissions
      let hasRequiredPermissions = false;
      
      if (requiredPermissions.length === 0) {
        hasRequiredPermissions = true;
      } else if (requireAll) {
        // Require ALL permissions
        hasRequiredPermissions = requiredPermissions.every(permission => 
          checkPermission(permission)
        );
      } else {
        // Require ANY permission
        hasRequiredPermissions = requiredPermissions.some(permission => 
          checkPermission(permission)
        );
      }

      if (!hasRequiredPermissions) {
        setIsAuthorized(false);
        onUnauthorized?.();
        if (!showUnauthorized) {
          router.push(fallbackPath);
        }
      } else {
        setIsAuthorized(true);
      }
      
      setIsChecking(false);
    };

    checkAuthorization();
  }, [isAuthenticated, user, requiredPermissions, isLoading, router, fallbackPath, checkPermission, showUnauthorized, onUnauthorized, requireAll]);

  // Show loading spinner while checking
  if (isLoading || isChecking) {
    return showLoading ? (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    ) : null;
  }

  // Show unauthorized component if not authorized
  if (!isAuthorized && showUnauthorized) {
    return (
      <>
        {customUnauthorizedComponent || (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full text-center">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
                <p className="text-gray-600 mb-6">
                  Bạn cần quyền: {requiredPermissions.join(', ')}
                  {requireAll && ' (tất cả)'}
                </p>
                <button
                  onClick={() => router.back()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Don't render children if not authorized
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

// Conditional Rendering Hooks
export function useRoleCheck(requiredRoles: UserRole[]) {
  const { user, hasRole } = useAuth();
  
  if (!user) return false;
  
  return requiredRoles.length === 0 || requiredRoles.some(role => hasRole(role));
}

export function usePermissionCheck(requiredPermissions: Permission[], requireAll = false) {
  const { user, checkPermission } = useAuth();
  
  if (!user) return false;
  
  if (requiredPermissions.length === 0) return true;
  
  if (requireAll) {
    return requiredPermissions.every(permission => checkPermission(permission));
  } else {
    return requiredPermissions.some(permission => checkPermission(permission));
  }
}

// Conditional Rendering Components
interface ConditionalRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function IfRole({ children, fallback = null }: ConditionalRenderProps & { roles: UserRole[] }) {
  const hasRole = useRoleCheck((children as any).props?.roles || []);
  return hasRole ? <>{children}</> : <>{fallback}</>;
}

export function IfPermission({ children, fallback = null }: ConditionalRenderProps & { 
  permissions: Permission[];
  requireAll?: boolean;
}) {
  const hasPermission = usePermissionCheck(
    (children as any).props?.permissions || [], 
    (children as any).props?.requireAll || false
  );
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Convenience Guards
export function AdminOrManagerGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRoles={[UserRole.ADMIN]}>
      {children}
    </RoleGuard>
  );
}

export function RestaurantOrAdminGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRoles={[UserRole.RESTAURANT, UserRole.ADMIN]}>
      {children}
    </RoleGuard>
  );
}

export function DriverOrAdminGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRoles={[UserRole.DRIVER, UserRole.ADMIN]}>
      {children}
    </RoleGuard>
  );
}
