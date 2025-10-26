'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Permission } from '@/types/auth';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  fallbackPath?: string;
  showLoading?: boolean;
}

export function AuthGuard({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/login',
  showLoading = true,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user, hasRole, checkPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.replace(fallbackPath);
      return;
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      console.log('🚫 Role check failed:', {
        requiredRole,
        userRole: user?.role,
        hasRoleResult: hasRole(requiredRole),
        user: user
      });
      router.replace('/unauthorized');
      return;
    }

    // Check permission requirement
    if (requiredPermission && !checkPermission(requiredPermission)) {
      router.replace('/unauthorized');
      return;
    }
  }, [isAuthenticated, isLoading, user, requiredRole, requiredPermission, router, fallbackPath, hasRole, checkPermission]);

  // Show loading spinner while checking authentication
  if (isLoading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or authorized
  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  if (requiredPermission && !checkPermission(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminGuard({ children, fallbackPath = '/admin/login' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <AuthGuard requiredRole={UserRole.ADMIN} fallbackPath={fallbackPath}>
      {children}
    </AuthGuard>
  );
}

export function CustomerGuard({ children, fallbackPath = '/customer/login' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <AuthGuard requiredRole={UserRole.CUSTOMER} fallbackPath={fallbackPath}>
      {children}
    </AuthGuard>
  );
}

export function RestaurantGuard({ children, fallbackPath = '/restaurant/login' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <AuthGuard requiredRole={UserRole.RESTAURANT} fallbackPath={fallbackPath}>
      {children}
    </AuthGuard>
  );
}

export function DriverGuard({ children, fallbackPath = '/driver/login' }: { children: ReactNode; fallbackPath?: string }) {
  return (
    <AuthGuard requiredRole={UserRole.DRIVER} fallbackPath={fallbackPath}>
      {children}
    </AuthGuard>
  );
}

// Permission-based guards
export function PermissionGuard({
  children,
  permission,
  fallbackPath = '/unauthorized',
}: {
  children: ReactNode;
  permission: Permission;
  fallbackPath?: string;
}) {
  return (
    <AuthGuard requiredPermission={permission} fallbackPath={fallbackPath}>
      {children}
    </AuthGuard>
  );
}
