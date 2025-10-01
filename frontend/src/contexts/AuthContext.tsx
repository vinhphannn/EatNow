'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthTokens, LoginCredentials, AuthState, AuthContextType, Permission, UserRole } from '@/types/auth';
import { authService } from '@/services/auth.service';

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: AuthTokens }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_USER'; payload: User | null };

// Initial State
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        tokens: action.payload,
        isLoading: false,
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
    default:
      return state;
  }
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

        // Initialize auth state on mount
        useEffect(() => {
          const initializeAuth = async () => {
            try {
              dispatch({ type: 'SET_LOADING', payload: true });

              // For cookie-based authentication, check if user is authenticated
              // by making a request to a protected endpoint
              try {
                const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const response = await fetch(`${api}/api/v1/auth/me`, {
                  credentials: 'include',
                  method: 'GET',
                });

                if (response.ok) {
                  const userData = await response.json();
                  dispatch({ type: 'SET_USER', payload: userData });
                } else {
                  dispatch({ type: 'SET_USER', payload: null });
                }
              } catch (error) {
                console.error('Auth check failed:', error);
                dispatch({ type: 'SET_USER', payload: null });
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

       // Login function
       const login = async (credentials: LoginCredentials): Promise<void> => {
         try {
           dispatch({ type: 'LOGIN_START' });

           // Call login to set HttpOnly cookie and return user info
           const { user } = await authService.login(credentials);

           // Tokens are cookie-based; store only user in state
           dispatch({ type: 'LOGIN_SUCCESS', payload: { user, tokens: null as any } });
         } catch (error) {
           console.error("Login error:", error);
           const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
           dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
           throw error;
         }
       };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    // Optional: implement cookie-based refresh if needed
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  // Check permission function
  const checkPermission = (permission: Permission): boolean => {
    return authService.hasPermission(state.user, permission);
  };

  // Check role function
  const hasRole = (role: UserRole): boolean => {
    return authService.hasRole(state.user, role);
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    checkPermission,
    hasRole,
    clearError,
  };



  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for specific roles
export function useAdminAuth() {
  const auth = useAuth();
  return {
    ...auth,
    isAdmin: auth.hasRole(UserRole.ADMIN),
    canAccessAdmin: auth.checkPermission(Permission.ADMIN_DASHBOARD),
  };
}

export function useCustomerAuth() {
  const auth = useAuth();
  return {
    ...auth,
    isCustomer: auth.hasRole(UserRole.CUSTOMER),
    canOrder: auth.checkPermission(Permission.CUSTOMER_ORDER),
  };
}

export function useRestaurantAuth() {
  const auth = useAuth();
  return {
    ...auth,
    isRestaurant: auth.hasRole(UserRole.RESTAURANT),
    canManageOrders: auth.checkPermission(Permission.RESTAURANT_ORDERS),
  };
}

export function useDriverAuth() {
  const auth = useAuth();
  return {
    ...auth,
    isDriver: auth.hasRole(UserRole.DRIVER),
    canAcceptOrders: auth.checkPermission(Permission.DRIVER_ORDERS),
  };
}
