// API Client for EatNow application
import { redirectToAppropriateLogin } from '@/hooks/useRoleAuth';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  status: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Ensure '/api/v1' prefix is present
    this.baseURL = rawBase.endsWith('/api/v1') ? rawBase : `${rawBase.replace(/\/$/, '')}/api/v1`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Normalize endpoint to avoid double prefixes when callers pass '/api/v1/...'
    const normalized = endpoint.startsWith('/api/v1')
      ? endpoint.replace(/^\/api\/v1/, '')
      : endpoint;
    const url = `${this.baseURL}${normalized}`;
    
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Cookie-based auth only; do not send Authorization from localStorage

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          
          if (!response.ok) {
            const error = new Error(data.message || 'An error occurred') as any;
            error.code = data.code;
            error.details = data.details;
            error.status = response.status;
            throw error;
          }
          
          return data;
        } catch (jsonError) {
          // Quietly handle invalid JSON from server and surface a consistent error without noisy logs
          const error = new Error('Invalid JSON response from server') as any;
          error.status = response.status;
          throw error;
        }
      } else if (contentType && contentType.includes('application/octet-stream')) {
        // Handle binary responses (for exports)
        if (!response.ok) {
          const error = new Error('Failed to download file') as any;
          error.status = response.status;
          throw error;
        }
        return response.blob() as T;
      } else {
        // Handle text responses
        const text = await response.text();
        if (!response.ok) {
          const error = new Error(text || 'An error occurred') as any;
          error.status = response.status;
          throw error;
        }
        return text as T;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }
      
      // Network or other errors
      const networkError = new Error(error instanceof Error ? error.message : 'Network error') as any;
      networkError.status = 0;
      throw networkError;
    }
  }

  async get<T>(endpoint: string, options: { params?: Record<string, any> } = {}): Promise<T> {
    const normalized = endpoint.startsWith('/api/v1')
      ? endpoint.replace(/^\/api\/v1/, '')
      : endpoint;
    const url = new URL(`${this.baseURL}${normalized}`);
    
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Upload file
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {},
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const uploadError = new Error(error.message || 'Upload failed') as any;
      uploadError.status = response.status;
      throw uploadError;
    }

    return response.json();
  }

  // Download file
  async download(endpoint: string, filename?: string): Promise<void> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {},
      credentials: 'include',
    });

    if (!response.ok) {
      const error = new Error('Download failed') as any;
      error.status = response.status;
      throw error;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const apiClient = new ApiClient();

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error && typeof error === 'object' && 'status' in error) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Request interceptor for adding common headers
export const setAuthToken = (token: string) => {
  // Deprecated: Cookie-based auth doesn't need localStorage
  console.warn('setAuthToken is deprecated. Use cookie-based authentication instead.');
};

export const clearAuthToken = () => {
  // Deprecated: Cookie-based auth doesn't need localStorage
  console.warn('clearAuthToken is deprecated. Use authService.logout() instead.');
};

// Response interceptor for handling common errors
export const setupResponseInterceptors = () => {
  // Handle 401 errors globally
  const originalRequest = apiClient.request;
  
  apiClient.request = async function<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      return await originalRequest.call(this, endpoint, options);
    } catch (error) {
      if (error && typeof error === 'object' && error.status === 401) {
        // Token expired, redirect to appropriate login based on current path
        // Cookie-based auth: cookies are automatically cleared by backend
        redirectToAppropriateLogin();
      }
      throw error;
    }
  };
};

// Initialize interceptors
if (typeof window !== 'undefined') {
  setupResponseInterceptors();
}
