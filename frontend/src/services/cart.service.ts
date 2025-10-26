import { apiClient } from './api.client';

export interface CartItem {
  id: string;
  item: {
    id: string;
    name: string;
    price: number;
    type: string;
    description?: string;
    imageUrl?: string;
    imageId?: string;
    rating: number;
  };
  restaurant: {
    id: string;
    name: string;
    address?: string;
  };
  quantity: number;
  specialInstructions?: string;
  subtotal: number;
}

export interface AddToCartRequest {
  itemId: string;
  quantity?: number;
  specialInstructions?: string;
  options?: Record<string, string[]>;
}

export interface UpdateCartItemRequest {
  quantity: number;
  specialInstructions?: string;
}

class CartService {
  async addToCart(restaurantId: string, data: AddToCartRequest, token: string): Promise<any> {
    return apiClient.post<any>(`/api/v1/cart/${restaurantId}/items`, {
      itemId: data.itemId,
      quantity: data.quantity || 1,
      options: data.options ? Object.entries(data.options).map(([optionId, choices]) => ({
        optionId,
        choices: choices.map(choiceId => ({ choiceId, quantity: 1 }))
      })) : [],
    });
  }

  async getCart(restaurantId: string, token: string): Promise<any> {
    return apiClient.get<any>(`/api/v1/cart/${restaurantId}`);
  }

  async getAllCarts(token: string): Promise<any[]> {
    return apiClient.get<any[]>(`/api/v1/cart/user/all`);
  }

  async getCartSummary(restaurantId: string, token: string): Promise<any> {
    const cart = await this.getCart(restaurantId, token);
    return {
      count: cart.totalItems || 0,
      total: cart.totalAmount || 0,
      totalItems: cart.totalItems || 0,
      totalAmount: cart.totalAmount || 0
    };
  }

  async getGlobalCartSummary(token: string): Promise<any> {
    const allCarts = await this.getAllCarts(token);
    const totalItems = allCarts.reduce((sum, cart) => sum + (cart.totalItems || 0), 0);
    const totalAmount = allCarts.reduce((sum, cart) => sum + (cart.totalAmount || 0), 0);
    return { totalItems, totalAmount };
  }

  async updateCartItem(restaurantId: string, cartItemId: string, data: UpdateCartItemRequest, token: string): Promise<any> {
    return apiClient.put(`/api/v1/cart/${restaurantId}/items/${cartItemId}`, {
      quantity: data.quantity
    });
  }

  async updateCartItemById(cartItemId: string, data: UpdateCartItemRequest, token: string): Promise<any> {
    // For new API, we need to find which restaurant this item belongs to
    const allCarts = await this.getAllCarts(token);
    for (const cart of allCarts) {
      const item = cart.items?.find((item: any) => item.itemId === cartItemId);
      if (item) {
        return this.updateCartItem(cart.restaurantId, cartItemId, data, token);
      }
    }
    throw new Error('Cart item not found');
  }

  async removeFromCart(restaurantId: string, cartItemId: string, token: string): Promise<any> {
    return apiClient.delete(`/api/v1/cart/${restaurantId}/items/${cartItemId}`);
  }

  async removeFromCartById(cartItemId: string, token: string): Promise<any> {
    // For new API, we need to find which restaurant this item belongs to
    const allCarts = await this.getAllCarts(token);
    for (const cart of allCarts) {
      const item = cart.items?.find((item: any) => item.itemId === cartItemId);
      if (item) {
        return this.removeFromCart(cart.restaurantId, cartItemId, token);
      }
    }
    throw new Error('Cart item not found');
  }

  async clearCart(restaurantId: string, token: string): Promise<any> {
    return apiClient.delete(`/api/v1/cart/${restaurantId}/clear`);
  }
}

export const cartService = new CartService();