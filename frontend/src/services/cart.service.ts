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
}

export interface UpdateCartItemRequest {
  quantity: number;
  specialInstructions?: string;
}

class CartService {
  async addToCart(data: AddToCartRequest, token: string): Promise<any> {
    return apiClient.post<any>(`/api/v1/cart/add`, {
      itemId: data.itemId,
      quantity: data.quantity || 1,
      specialInstructions: data.specialInstructions,
    });
  }

  async getCart(token: string): Promise<CartItem[]> {
    return apiClient.get<CartItem[]>(`/api/v1/cart`);
  }

  async getCartSummary(token: string): Promise<any> {
    return apiClient.get(`/api/v1/cart/summary`); // simple summary via full cart for now
  }

  async updateCartItem(cartItemId: string, data: UpdateCartItemRequest, token: string): Promise<any> {
    return apiClient.put(`/api/v1/cart/${cartItemId}`, data);
  }

  async removeFromCart(cartItemId: string, token: string): Promise<any> {
    return apiClient.delete(`/api/v1/cart/${cartItemId}`);
  }

  async clearCart(token: string): Promise<any> {
    return apiClient.delete(`/api/v1/cart`);
  }
}

export const cartService = new CartService();