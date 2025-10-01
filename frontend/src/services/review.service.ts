import { apiCall } from "./api.service";

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'restaurant' | 'item' | 'driver' | 'order';
  rating: number;
  title?: string;
  comment?: string;
  foodQuality?: number;
  serviceQuality?: number;
  deliverySpeed?: number;
  packaging?: number;
  valueForMoney?: number;
  imageUrls?: string[];
  helpfulCount: number;
  unhelpfulCount: number;
  response?: string;
  responseAt?: string;
  isVerified: boolean;
  isAnonymous: boolean;
  createdAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  averageFoodQuality: number;
  averageServiceQuality: number;
  averageDeliverySpeed: number;
  averagePackaging: number;
  averageValueForMoney: number;
}

export interface CreateReviewRequest {
  type: 'restaurant' | 'item' | 'driver' | 'order';
  restaurantId?: string;
  itemId?: string;
  driverId?: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  foodQuality?: number;
  serviceQuality?: number;
  deliverySpeed?: number;
  packaging?: number;
  valueForMoney?: number;
  imageUrls?: string[];
}

class ReviewService {
  private API_ENDPOINTS = {
    REVIEWS_PUBLIC: '/reviews/public',
    REVIEWS_STATS: '/reviews/public/stats',
    MY_REVIEWS: '/reviews/my-reviews',
    CREATE_REVIEW: '/reviews',
    MARK_HELPFUL: '/reviews',
    MARK_UNHELPFUL: '/reviews',
  };

  async getReviews(options?: {
    type?: 'restaurant' | 'item' | 'driver' | 'order';
    restaurantId?: string;
    itemId?: string;
    driverId?: string;
    limit?: number;
    skip?: number;
    rating?: number;
    featured?: boolean;
  }): Promise<{ reviews: Review[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.restaurantId) params.append('restaurantId', options.restaurantId);
    if (options?.itemId) params.append('itemId', options.itemId);
    if (options?.driverId) params.append('driverId', options.driverId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.skip) params.append('skip', options.skip.toString());
    if (options?.rating) params.append('rating', options.rating.toString());
    if (options?.featured !== undefined) params.append('featured', options.featured.toString());

    const endpoint = `${this.API_ENDPOINTS.REVIEWS_PUBLIC}?${params.toString()}`;
    const data = await apiCall(endpoint, 'GET');
    return data;
  }

  async getReviewStats(options?: {
    type?: 'restaurant' | 'item' | 'driver' | 'order';
    restaurantId?: string;
    itemId?: string;
    driverId?: string;
  }): Promise<ReviewStats> {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.restaurantId) params.append('restaurantId', options.restaurantId);
    if (options?.itemId) params.append('itemId', options.itemId);
    if (options?.driverId) params.append('driverId', options.driverId);

    const endpoint = `${this.API_ENDPOINTS.REVIEWS_STATS}?${params.toString()}`;
    const data = await apiCall(endpoint, 'GET');
    return data as ReviewStats;
  }

  async getMyReviews(): Promise<any[]> {
    const data = await apiCall(this.API_ENDPOINTS.MY_REVIEWS, 'GET', null, true);
    return data;
  }

  async createReview(reviewData: CreateReviewRequest): Promise<any> {
    const data = await apiCall(this.API_ENDPOINTS.CREATE_REVIEW, 'POST', reviewData, true);
    return data;
  }

  async markHelpful(reviewId: string): Promise<any> {
    const data = await apiCall(`${this.API_ENDPOINTS.MARK_HELPFUL}/${reviewId}/helpful`, 'PUT', null, true);
    return data;
  }

  async markUnhelpful(reviewId: string): Promise<any> {
    const data = await apiCall(`${this.API_ENDPOINTS.MARK_UNHELPFUL}/${reviewId}/unhelpful`, 'PUT', null, true);
    return data;
  }

  // Helper methods
  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }

  getRatingText(rating: number): string {
    if (rating >= 4.5) return 'Tuyệt vời';
    if (rating >= 4.0) return 'Rất tốt';
    if (rating >= 3.5) return 'Tốt';
    if (rating >= 3.0) return 'Khá tốt';
    if (rating >= 2.5) return 'Trung bình';
    if (rating >= 2.0) return 'Kém';
    return 'Rất kém';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hôm nay';
    if (diffInDays === 1) return 'Hôm qua';
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} tuần trước`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} tháng trước`;
    return `${Math.floor(diffInDays / 365)} năm trước`;
  }

  getDetailedRatingText(type: string, rating: number): string {
    const ratingMap: Record<string, Record<number, string>> = {
      foodQuality: {
        5: 'Món ăn tuyệt vời',
        4: 'Món ăn ngon',
        3: 'Món ăn ổn',
        2: 'Món ăn không ngon',
        1: 'Món ăn rất tệ',
      },
      serviceQuality: {
        5: 'Dịch vụ xuất sắc',
        4: 'Dịch vụ tốt',
        3: 'Dịch vụ bình thường',
        2: 'Dịch vụ kém',
        1: 'Dịch vụ rất tệ',
      },
      deliverySpeed: {
        5: 'Giao hàng rất nhanh',
        4: 'Giao hàng nhanh',
        3: 'Giao hàng đúng giờ',
        2: 'Giao hàng chậm',
        1: 'Giao hàng rất chậm',
      },
      packaging: {
        5: 'Đóng gói hoàn hảo',
        4: 'Đóng gói tốt',
        3: 'Đóng gói bình thường',
        2: 'Đóng gói kém',
        1: 'Đóng gói rất tệ',
      },
      valueForMoney: {
        5: 'Giá trị tuyệt vời',
        4: 'Đáng đồng tiền',
        3: 'Giá trị hợp lý',
        2: 'Hơi đắt',
        1: 'Rất đắt',
      },
    };

    return ratingMap[type]?.[Math.round(rating)] || 'Không đánh giá';
  }
}

export const reviewService = new ReviewService();
