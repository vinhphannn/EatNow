'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthTokens, LoginCredentials, AuthState, AuthContextType, Permission, UserRole } from '@/types/auth';
import { advancedAuthService } from '@/services/advanced-auth.service';

// Enhanced Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: AuthTokens }
  | { type: 'REFRESH_TOKEN_FAILURE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'TOKEN_REFRESH'; payload: AuthTokens }
  | { type: 'MULTI_TAB_SYNC'; payload: { action: string; data?: any } }
  | { type: 'DEVICE_LIST_UPDATE'; payload: any[] }
  | { type: 'SESSION_EXPIRED' };

// Enhanced Initial State
const initialState: AuthState & {
  isRefreshing: boolean;
  activeDevices: any[];
  lastActivity: number;
  multiTabSync: boolean;
} = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isRefreshing: false,
  activeDevices: [],
  lastActivity: Date.now(),
  multiTabSync: false,
};

// Enhanced Auth Reducer
function advancedAuthReducer(state: typeof initialState, action: AuthAction): typeof initialState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        isRefreshing: false,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isRefreshing: false,
        lastActivity: Date.now(),
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isRefreshing: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isRefreshing: false,
        activeDevices: [],
        lastActivity: Date.now(),
      };
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        tokens: action.payload,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastActivity: Date.now(),
      };
    case 'REFRESH_TOKEN_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.',
        isRefreshing: false,
      };
    case 'TOKEN_REFRESH':
      return {
        ...state,
        tokens: action.payload,
        isRefreshing: false,
        lastActivity: Date.now(),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case 'MULTI_TAB_SYNC':
      return {
        ...state,
        multiTabSync: true,
      };
    case 'DEVICE_LIST_UPDATE':
      return {
        ...state,
        activeDevices: action.payload,
      };
    case 'SESSION_EXPIRED':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        error: 'Session expired. Please login again.',
      };
    default:
      return state;
  }
}

// Enhanced Auth Context Type
interface AdvancedAuthContextType extends AuthContextType {
  isRefreshing: boolean;
  activeDevices: any[];
  lastActivity: number;
  multiTabSync: boolean;
  logoutAllDevices: () => Promise<void>;
  terminateDevice: (deviceId: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  getCurrentTokens: () => AuthTokens | null;
  updateLastActivity: () => void;
}

// Create Context
const AdvancedAuthContext = createContext<AdvancedAuthContextType | undefined>(undefined);

// Enhanced Auth Provider Component
interface AdvancedAuthProviderProps {
  children: ReactNode;
  enableMultiTabSync?: boolean;
  autoRefreshInterval?: number;
  sessionTimeout?: number;
}

export function AdvancedAuthProvider({ 
  children, 
  enableMultiTabSync = true,
  autoRefreshInterval = 60000, // 1 minute
  sessionTimeout = 30 * 60 * 1000, // 30 minutes
}: AdvancedAuthProviderProps) {
  const [state, dispatch] = useReducer(advancedAuthReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const user = advancedAuthService.getCurrentUser();
        const tokens = advancedAuthService.getCurrentTokens();
        
        if (user && tokens && advancedAuthService.isAuthenticated()) {
          dispatch({ type: 'SET_USER', payload: user });
          dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: tokens });
        } else {
          dispatch({ type: 'SET_USER', payload: null });
        }
        
        // Load active devices
        try {
          const devices = await advancedAuthService.getActiveDevices();
          dispatch({ type: 'DEVICE_LIST_UPDATE', payload: devices });
        } catch (error) {
          console.error('Failed to load active devices:', error);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'SET_USER', payload: null });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Multi-tab synchronization
  useEffect(() => {
    if (!enableMultiTabSync) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'eatnow_broadcast') {
        try {
          const message = JSON.parse(e.newValue || '{}');
          handleMultiTabMessage(message);
        } catch (error) {
          console.error('Failed to parse broadcast message:', error);
        }
      }
    };

    const handleMultiTabMessage = (message: any) => {
      switch (message.action) {
        case 'LOGIN':
          dispatch({ type: 'LOGIN_SUCCESS', payload: message.data });
          break;
        case 'LOGOUT':
          dispatch({ type: 'LOGOUT' });
          break;
        case 'TOKEN_REFRESH':
          dispatch({ type: 'TOKEN_REFRESH', payload: message.data.tokens });
          break;
        case 'SESSION_EXPIRED':
          dispatch({ type: 'SESSION_EXPIRED' });
          break;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [enableMultiTabSync]);

  // Auto-refresh and session timeout
  useEffect(() => {
    const interval = setInterval(async () => {
      if (state.isAuthenticated && advancedAuthService.isTokenExpired()) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          await advancedAuthService.refreshAccessToken();
          const tokens = advancedAuthService.getCurrentTokens();
          if (tokens) {
            dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: tokens });
          }
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          dispatch({ type: 'REFRESH_TOKEN_FAILURE' });
        }
      }

      // Check session timeout
      if (state.isAuthenticated && (Date.now() - state.lastActivity) > sessionTimeout) {
        dispatch({ type: 'SESSION_EXPIRED' });
        advancedAuthService.logout();
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.lastActivity, autoRefreshInterval, sessionTimeout]);

  // Enhanced Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const { user, tokens } = await advancedAuthService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, tokens } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Enhanced Logout function
  const logout = async (): Promise<void> => {
    try {
      await advancedAuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Logout all devices
  const logoutAllDevices = async (): Promise<void> => {
    try {
      await advancedAuthService.logout(true);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout all devices error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Terminate specific device
  const terminateDevice = async (deviceId: string): Promise<void> => {
    try {
      await advancedAuthService.terminateDevice(deviceId);
      const devices = await advancedAuthService.getActiveDevices();
      dispatch({ type: 'DEVICE_LIST_UPDATE', payload: devices });
    } catch (error) {
      console.error('Terminate device error:', error);
    }
  };

  // Enhanced Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const tokens = await advancedAuthService.refreshAccessToken();
      dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: tokens });
    } catch (error) {
      console.error('Token refresh error:', error);
      dispatch({ type: 'REFRESH_TOKEN_FAILURE' });
      throw error;
    }
  };

  // Enhanced Permission checking
  const checkPermission = useCallback((permission: Permission): boolean => {
    return advancedAuthService.hasPermission(state.user, permission);
  }, [state.user]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return advancedAuthService.hasRole(state.user, role);
  }, [state.user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return advancedAuthService.hasAnyRole(state.user, roles);
  }, [state.user]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return advancedAuthService.hasAllPermissions(state.user, permissions);
  }, [state.user]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return advancedAuthService.hasAnyPermission(state.user, permissions);
  }, [state.user]);

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Get current tokens
  const getCurrentTokens = useCallback((): AuthTokens | null => {
    return advancedAuthService.getCurrentTokens();
  }, []);

  // Update last activity
  const updateLastActivity = useCallback((): void => {
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const contextValue: AdvancedAuthContextType = {
    ...state,
    login,
    logout,
    logoutAllDevices,
    terminateDevice,
    refreshToken,
    checkPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    hasAnyPermission,
    getCurrentTokens,
    updateLastActivity,
    clearError,
  };

  return (
    <AdvancedAuthContext.Provider value={contextValue}>
      {children}
    </AdvancedAuthContext.Provider>
  );
}

// Custom hook to use advanced auth context
export function useAdvancedAuth(): AdvancedAuthContextType {
  const context = useContext(AdvancedAuthContext);
  if (context === undefined) {
    throw new Error('useAdvancedAuth must be used within an AdvancedAuthProvider');
  }
  return context;
}

// Enhanced convenience hooks for specific roles
export function useAdvancedAdminAuth() {
  const auth = useAdvancedAuth();
  return {
    ...auth,
    isAdmin: auth.hasRole(UserRole.ADMIN),
    canAccessAdmin: auth.checkPermission(Permission.ADMIN_DASHBOARD),
    canManageUsers: auth.checkPermission(Permission.ADMIN_USERS),
    canManageRestaurants: auth.checkPermission(Permission.ADMIN_RESTAURANTS),
    canManageDrivers: auth.checkPermission(Permission.ADMIN_DRIVERS),
    canViewAnalytics: auth.checkPermission(Permission.ADMIN_ANALYTICS),
  };
}

export function useAdvancedCustomerAuth() {
  const auth = useAdvancedAuth();
  return {
    ...auth,
    isCustomer: auth.hasRole(UserRole.CUSTOMER),
    canOrder: auth.checkPermission(Permission.CUSTOMER_ORDER),
    canManageProfile: auth.checkPermission(Permission.CUSTOMER_PROFILE),
    canManageCart: auth.checkPermission(Permission.CUSTOMER_CART),
  };
}

export function useAdvancedRestaurantAuth() {
  const auth = useAdvancedAuth();
  return {
    ...auth,
    isRestaurant: auth.hasRole(UserRole.RESTAURANT),
    canManageOrders: auth.checkPermission(Permission.RESTAURANT_ORDERS),
    canManageMenu: auth.checkPermission(Permission.RESTAURANT_MENU),
    canManageProfile: auth.checkPermission(Permission.RESTAURANT_PROFILE),
    canViewDashboard: auth.checkPermission(Permission.RESTAURANT_DASHBOARD),
  };
}

export function useAdvancedDriverAuth() {
  const auth = useAdvancedAuth();
  return {
    ...auth,
    isDriver: auth.hasRole(UserRole.DRIVER),
    canAcceptOrders: auth.checkPermission(Permission.DRIVER_ORDERS),
    canManageProfile: auth.checkPermission(Permission.DRIVER_PROFILE),
    canViewDashboard: auth.checkPermission(Permission.DRIVER_DASHBOARD),
  };
}
