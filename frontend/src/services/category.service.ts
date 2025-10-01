// API call utility function
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API call failed: ${response.statusText}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (fetchError) {
    console.error('API call error:', fetchError);
    throw fetchError;
  }
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  position: number;
  isActive: boolean;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

class CategoryService {
  private readonly API_ENDPOINTS = {
    GET_ALL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories`,
    GET_PUBLIC: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/public`,
    GET_BY_ID: (id: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/${id}`,
    CREATE: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories`,
    UPDATE: (id: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/${id}`,
    DELETE: (id: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/${id}`,
    SEED_DEFAULT: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/seed-default`,
  };

  /**
   * Lấy tất cả categories
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      return await apiCall(this.API_ENDPOINTS.GET_ALL, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Lấy categories công khai (cho frontend)
   */
  async getPublicCategories(): Promise<Category[]> {
    try {
      return await apiCall(this.API_ENDPOINTS.GET_PUBLIC, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error fetching public categories:', error);
      throw error;
    }
  }

  /**
   * Lấy category theo ID
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      return await apiCall(this.API_ENDPOINTS.GET_BY_ID(id), {
        method: 'GET',
      });
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  }

  /**
   * Tạo category mới (Admin/Restaurant)
   */
  async createCategory(categoryData: Partial<Category>, token: string): Promise<Category> {
    try {
      return await apiCall(this.API_ENDPOINTS.CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Cập nhật category (Admin/Restaurant)
   */
  async updateCategory(id: string, categoryData: Partial<Category>, token: string): Promise<Category> {
    try {
      return await apiCall(this.API_ENDPOINTS.UPDATE(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Xóa category (Admin/Restaurant)
   */
  async deleteCategory(id: string, token: string): Promise<void> {
    try {
      await apiCall(this.API_ENDPOINTS.DELETE(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Seed default categories (Admin only)
   */
  async seedDefaultCategories(token: string): Promise<Category[]> {
    try {
      return await apiCall(this.API_ENDPOINTS.SEED_DEFAULT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error seeding default categories:', error);
      throw error;
    }
  }
}

export const categoryService = new CategoryService();