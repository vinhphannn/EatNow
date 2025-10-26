import { apiClient } from './api.client';

export interface GlobalCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  position: number;
  isActive: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  tags: string[];
  restaurantCount: number;
  orderCount: number;
  popularityScore: number;
  viewCount: number;
  clickCount: number;
  conversionRate: number;
  parentCategoryId?: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGlobalCategoryDto {
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  position?: number;
  isActive?: boolean;
  isVisible?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  parentCategoryId?: string;
}

export interface UpdateGlobalCategoryDto {
  name?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  position?: number;
  isActive?: boolean;
  isVisible?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  parentCategoryId?: string;
}

export interface GlobalCategoriesResponse {
  categories: GlobalCategory[];
  total: number;
  limit: number;
  skip: number;
}

export const globalCategoriesService = {
  // Public endpoints
  async getPublicCategories(featured?: boolean, limit?: number, skip?: number): Promise<GlobalCategory[]> {
    const params = new URLSearchParams();
    if (featured !== undefined) params.append('featured', featured.toString());
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    const response = await apiClient.get(`/api/v1/global-categories/public?${params.toString()}`);
    return response as GlobalCategory[];
  },

  async getPopularCategories(limit?: number): Promise<GlobalCategory[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await apiClient.get(`/api/v1/global-categories/public/popular?${params.toString()}`);
    return response as GlobalCategory[];
  },

  async getCategoryBySlug(slug: string): Promise<GlobalCategory | null> {
    const response = await apiClient.get(`/api/v1/global-categories/public/${slug}`);
    return response as GlobalCategory | null;
  },

  // Admin endpoints
  async getAllCategoriesAdmin(search?: string, limit?: number, skip?: number): Promise<GlobalCategoriesResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    const response = await apiClient.get(`/api/v1/global-categories/admin?${params.toString()}`);
    return response as GlobalCategoriesResponse;
  },

  async getCategoryByIdAdmin(id: string): Promise<GlobalCategory> {
    const response = await apiClient.get(`/api/v1/global-categories/admin/${id}`);
    return response as GlobalCategory;
  },

  async createCategory(data: CreateGlobalCategoryDto): Promise<GlobalCategory> {
    const response = await apiClient.post('/api/v1/global-categories/admin', data);
    return response as GlobalCategory;
  },

  async updateCategory(id: string, data: UpdateGlobalCategoryDto): Promise<GlobalCategory> {
    const response = await apiClient.put(`/api/v1/global-categories/admin/${id}`, data);
    return response as GlobalCategory;
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/api/v1/global-categories/admin/${id}`);
    return response as { message: string };
  },
};
