import { API_CONFIG } from '../config';

// API Service với caching và error handling
class ApiService {
  private baseURL: string;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Generic fetch với caching
  private async fetchWithCache<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Always include cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error for ${url}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl,
      });

      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Restaurant APIs
  async getRestaurants(): Promise<any[]> {
    return this.fetchWithCache('/demo/restaurants', {}, 3600000); // 1 hour cache
  }

  async getRestaurant(id: string): Promise<any> {
    return this.fetchWithCache(`/restaurants/${id}`, {}, 1800000); // 30 minutes cache
  }

  async getRestaurantItems(restaurantId: string): Promise<any[]> {
    return this.fetchWithCache(`/restaurants/${restaurantId}/items`, {}, 300000); // 5 minutes cache
  }

  async getAllItems(): Promise<any[]> {
    return this.fetchWithCache(`/search/items`, {}, 300000); // 5 minutes cache
  }

  async getCart(token: string): Promise<any[]> {
    return this.fetchWithCache('/api/v1/cart', {
      credentials: 'include' // Use cookies for authentication
    }, 0); // No caching for cart data
  }

  // Order APIs (no caching for sensitive data)
  async getOrder(id: string, token: string): Promise<any> {
    return this.fetchWithCache(`/api/v1/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }, 0); // No caching
  }

  async getOrders(token: string): Promise<any[]> {
    return this.fetchWithCache('/api/v1/orders', {
      headers: { Authorization: `Bearer ${token}` }
    }, 0); // No caching
  }

  // Search APIs
  async searchItems(query: string): Promise<any[]> {
    return this.fetchWithCache(`/search/items?q=${encodeURIComponent(query)}&size=20`, {}, 300000); // 5 minutes cache
  }

  // Cart APIs

  async addToCart(itemId: string, quantity: number, token: string): Promise<any> {
    return this.fetchWithCache('/api/v1/cart/add', {
      method: 'POST',
      credentials: 'include', // Use cookies for authentication
      body: JSON.stringify({ itemId, quantity })
    }, 0); // No caching
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific cache
  clearCacheForEndpoint(endpoint: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(endpoint));
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
