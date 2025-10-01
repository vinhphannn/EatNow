import { apiClient } from "./api.client";

export interface UserAddress {
  label: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  note?: string;
  isDefault?: boolean;
  city?: string;
  district?: string;
  ward?: string;
  phone?: string;
  recipientName?: string;
  isActive?: boolean;
}

export interface BusinessInfo {
  businessName?: string;
  businessLicense?: string;
  taxCode?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  description?: string;
}

export interface DriverInfo {
  licenseNumber?: string;
  vehicleType?: string;
  vehicleModel?: string;
  licensePlate?: string;
  bankAccount?: string;
  bankName?: string;
  isAvailable?: boolean;
}

export interface LastDeviceInfo {
  userAgent?: string;
  platform?: string;
  version?: string;
  model?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  phone?: string;
  role: 'admin' | 'customer' | 'driver' | 'restaurant';
  avatarUrl?: string;
  avatarId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  addresses: UserAddress[];
  addressLabels: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  language: string;
  country: string;
  timezone?: string;
  currency: string;
  allowPushNotifications: boolean;
  allowEmailNotifications: boolean;
  allowSMSNotifications: boolean;
  allowMarketingEmails: boolean;
  allowLocationTracking: boolean;
  favoriteCuisines: string[];
  dietaryRestrictions: string[];
  allergens: string[];
  spiceLevel: number;
  totalOrders: number;
  totalSpent: number;
  totalReviews: number;
  averageOrderValue: number;
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  referredBy?: string;
  referralCount: number;
  referralEarnings: number;
  failedLoginAttempts: number;
  lockedUntil?: string;
  passwordChangedAt?: string;
  passwordHistory: string[];
  deviceTokens: string[];
  lastDeviceInfo?: LastDeviceInfo;
  isDeleted: boolean;
  deletedAt?: string;
  dataRetentionUntil?: string;
  businessInfo?: BusinessInfo;
  driverInfo?: DriverInfo;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  language?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  allowPushNotifications?: boolean;
  allowEmailNotifications?: boolean;
  allowSMSNotifications?: boolean;
  allowMarketingEmails?: boolean;
  allowLocationTracking?: boolean;
  favoriteCuisines?: string[];
  dietaryRestrictions?: string[];
  allergens?: string[];
  spiceLevel?: number;
}

export interface AddAddressRequest {
  label: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  note?: string;
  isDefault?: boolean;
  city?: string;
  district?: string;
  ward?: string;
  phone?: string;
  recipientName?: string;
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  totalReviews: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  favoriteCuisines: string[];
  mostOrderedRestaurants: Array<{
    restaurantId: string;
    restaurantName: string;
    orderCount: number;
  }>;
  mostOrderedItems: Array<{
    itemId: string;
    itemName: string;
    orderCount: number;
  }>;
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
  orderTrends: Array<{
    date: string;
    count: number;
  }>;
}

class UserService {
  private API_ENDPOINTS = {
    PROFILE: '/api/v1/customer/profile',
    UPDATE_PROFILE: '/api/v1/customer/profile',
    ADD_ADDRESS: '/api/v1/customer/addresses',
    UPDATE_ADDRESS: '/api/v1/customer/addresses',
    DELETE_ADDRESS: '/api/v1/customer/addresses',
    PREFERENCES: '/api/v1/users/preferences',
    STATS: '/api/v1/customer/stats',
    UPLOAD_AVATAR: '/api/v1/users/avatar',
    VERIFY_EMAIL: '/api/v1/users/verify-email',
    VERIFY_PHONE: '/api/v1/users/verify-phone',
    CHANGE_PASSWORD: '/api/v1/users/change-password',
    DELETE_ACCOUNT: '/api/v1/users/account',
  };

  async getProfile(): Promise<User> {
    const data = await apiClient.get<any>(this.API_ENDPOINTS.PROFILE);
    // Convert customer response to user format
    return {
      id: data.userId?._id || data.userId || '',
      email: data.userId?.email || '',
      name: data.name,
      fullName: data.fullName,
      phone: data.phone,
      addresses: data.addresses || [],
      addressLabels: data.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
      // Add other required fields with defaults
      role: 'customer',
      isActive: data.isActive || true,
      loyaltyTier: data.loyaltyTier || 'bronze',
      totalSpent: data.totalSpent || 0,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      language: data.language || 'vi',
      country: data.country || 'VN',
      currency: data.currency || 'vietnam_dong',
      allowPushNotifications: data.allowPushNotifications || true,
      allowEmailNotifications: data.allowEmailNotifications || true,
      allowSMSNotifications: data.allowSMSNotifications || false,
      allowMarketingEmails: data.allowMarketingEmails || true,
      allowLocationTracking: data.allowLocationTracking || true,
      favoriteCuisines: data.favoriteCuisines || [],
      dietaryRestrictions: data.dietaryRestrictions || [],
      allergens: data.allergens || [],
      spiceLevel: data.spiceLevel || 0,
    } as User;
  }

  async updateProfile(updateData: UpdateUserRequest): Promise<User> {
    const data = await apiClient.put<any>(this.API_ENDPOINTS.UPDATE_PROFILE, updateData);
    // Convert customer response to user format
    return {
      id: data.userId?._id || data.userId || '',
      email: data.userId?.email || '',
      name: data.name,
      fullName: data.fullName,
      phone: data.phone,
      addresses: data.addresses || [],
      addressLabels: data.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
      // Add other required fields with defaults
      role: 'customer',
      isActive: data.isActive || true,
      loyaltyTier: data.loyaltyTier || 'bronze',
      totalSpent: data.totalSpent || 0,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      language: data.language || 'vi',
      country: data.country || 'VN',
      currency: data.currency || 'vietnam_dong',
      allowPushNotifications: data.allowPushNotifications || true,
      allowEmailNotifications: data.allowEmailNotifications || true,
      allowSMSNotifications: data.allowSMSNotifications || false,
      allowMarketingEmails: data.allowMarketingEmails || true,
      allowLocationTracking: data.allowLocationTracking || true,
      favoriteCuisines: data.favoriteCuisines || [],
      dietaryRestrictions: data.dietaryRestrictions || [],
      allergens: data.allergens || [],
      spiceLevel: data.spiceLevel || 0,
    } as User;
  }

  async addAddress(addressData: AddAddressRequest): Promise<User> {
    const data = await apiClient.post<any>(this.API_ENDPOINTS.ADD_ADDRESS, addressData);
    // Convert customer response to user format
    return {
      id: data.userId,
      email: data.userId?.email || '',
      name: data.name,
      fullName: data.fullName,
      phone: data.phone,
      addresses: data.addresses || [],
      addressLabels: data.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
      // Add other required fields with defaults
      role: 'customer',
      isActive: data.isActive || true,
      loyaltyTier: data.loyaltyTier || 'bronze',
      totalSpent: data.totalSpent || 0,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      language: data.language || 'vi',
      country: data.country || 'VN',
      currency: data.currency || 'vietnam_dong',
      allowPushNotifications: data.allowPushNotifications || true,
      allowEmailNotifications: data.allowEmailNotifications || true,
      allowSMSNotifications: data.allowSMSNotifications || false,
      allowMarketingEmails: data.allowMarketingEmails || true,
      allowLocationTracking: data.allowLocationTracking || true,
      favoriteCuisines: data.favoriteCuisines || [],
      dietaryRestrictions: data.dietaryRestrictions || [],
      allergens: data.allergens || [],
      spiceLevel: data.spiceLevel || 0,
    } as User;
  }

  async updateAddress(addressIndex: number, addressData: Partial<AddAddressRequest>): Promise<User> {
    const data = await apiClient.put<any>(`${this.API_ENDPOINTS.UPDATE_ADDRESS}/${addressIndex}`, addressData);
    // Convert customer response to user format
    return {
      id: data.userId,
      email: data.userId?.email || '',
      name: data.name,
      fullName: data.fullName,
      phone: data.phone,
      addresses: data.addresses || [],
      addressLabels: data.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
      // Add other required fields with defaults
      role: 'customer',
      isActive: data.isActive || true,
      loyaltyTier: data.loyaltyTier || 'bronze',
      totalSpent: data.totalSpent || 0,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      language: data.language || 'vi',
      country: data.country || 'VN',
      currency: data.currency || 'vietnam_dong',
      allowPushNotifications: data.allowPushNotifications || true,
      allowEmailNotifications: data.allowEmailNotifications || true,
      allowSMSNotifications: data.allowSMSNotifications || false,
      allowMarketingEmails: data.allowMarketingEmails || true,
      allowLocationTracking: data.allowLocationTracking || true,
      favoriteCuisines: data.favoriteCuisines || [],
      dietaryRestrictions: data.dietaryRestrictions || [],
      allergens: data.allergens || [],
      spiceLevel: data.spiceLevel || 0,
    } as User;
  }

  async deleteAddress(addressIndex: number): Promise<User> {
    const data = await apiClient.delete<any>(`${this.API_ENDPOINTS.DELETE_ADDRESS}/${addressIndex}`);
    // Convert customer response to user format
    return {
      id: data.userId,
      email: data.userId?.email || '',
      name: data.name,
      fullName: data.fullName,
      phone: data.phone,
      addresses: data.addresses || [],
      addressLabels: data.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
      // Add other required fields with defaults
      role: 'customer',
      isActive: data.isActive || true,
      loyaltyTier: data.loyaltyTier || 'bronze',
      totalSpent: data.totalSpent || 0,
      avatarUrl: data.avatarUrl,
      bio: data.bio,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      language: data.language || 'vi',
      country: data.country || 'VN',
      currency: data.currency || 'vietnam_dong',
      allowPushNotifications: data.allowPushNotifications || true,
      allowEmailNotifications: data.allowEmailNotifications || true,
      allowSMSNotifications: data.allowSMSNotifications || false,
      allowMarketingEmails: data.allowMarketingEmails || true,
      allowLocationTracking: data.allowLocationTracking || true,
      favoriteCuisines: data.favoriteCuisines || [],
      dietaryRestrictions: data.dietaryRestrictions || [],
      allergens: data.allergens || [],
      spiceLevel: data.spiceLevel || 0,
    } as User;
  }

  async updatePreferences(preferences: Partial<UpdateUserRequest>): Promise<User> {
    const data = await apiClient.put<User>(this.API_ENDPOINTS.PREFERENCES, preferences);
    return data as unknown as User;
  }

  async getStats(): Promise<UserStats> {
    const data = await apiClient.get<any>(this.API_ENDPOINTS.STATS);
    // Convert customer stats to user stats format
    return {
      totalOrders: data.totalOrders || 0,
      totalSpent: data.totalSpent || 0,
      averageOrderValue: data.averageOrderValue || 0,
      totalReviews: data.totalReviews || 0,
      favoriteCuisines: data.favoriteCuisines || [],
      mostOrderedRestaurants: data.mostOrderedRestaurants || [],
    } as UserStats;
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string; avatarId: string }> {
    const res = await apiClient.upload<{ id: string; url: string }>(`/api/v1/images/upload`, file);
    // Persist avatar to user profile
    await this.updateProfile({ avatarUrl: (res as any).url });
    return { avatarUrl: (res as any).url, avatarId: (res as any).id };
  }

  async deleteAvatar(): Promise<void> {
    await this.updateProfile({ avatarUrl: '' });
    return;
  }

  async verifyEmail(token: string): Promise<any> {
    return apiClient.post(`${this.API_ENDPOINTS.VERIFY_EMAIL}?token=${token}`);
  }

  async verifyPhone(code: string): Promise<any> {
    return apiClient.post(`${this.API_ENDPOINTS.VERIFY_PHONE}?code=${code}`);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    return apiClient.put(this.API_ENDPOINTS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  }

  async deleteAccount(password: string): Promise<any> {
    return apiClient.delete(`${this.API_ENDPOINTS.DELETE_ACCOUNT}?password=${encodeURIComponent(password)}`);
  }

  // Helper methods
  getLoyaltyTierColor(tier: string): string {
    const colorMap: Record<string, string> = {
      bronze: 'text-orange-600 bg-orange-100',
      silver: 'text-gray-600 bg-gray-100',
      gold: 'text-yellow-600 bg-yellow-100',
      platinum: 'text-purple-600 bg-purple-100',
    };
    return colorMap[tier] || 'text-gray-600 bg-gray-100';
  }

  getLoyaltyTierIcon(tier: string): string {
    const iconMap: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    };
    return iconMap[tier] || '⭐';
  }

  getLoyaltyTierName(tier: string): string {
    const nameMap: Record<string, string> = {
      bronze: 'Đồng',
      silver: 'Bạc',
      gold: 'Vàng',
      platinum: 'Bạch kim',
    };
    return nameMap[tier] || 'Thành viên';
  }

  getSpiceLevelText(level: number): string {
    const levelMap: Record<number, string> = {
      0: 'Không cay',
      1: 'Hơi cay',
      2: 'Cay nhẹ',
      3: 'Cay vừa',
      4: 'Cay nhiều',
      5: 'Rất cay',
    };
    return levelMap[level] || 'Chưa thiết lập';
  }

  getSpiceLevelIcon(level: number): string {
    return '🌶️'.repeat(level);
  }

  formatCurrency(amount: number, currency: string = 'vietnam_dong'): string {
    if (currency === 'vietnam_dong') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    }
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getDefaultAddress(user: User): UserAddress | null {
    return user.addresses.find(addr => addr.isDefault) || user.addresses[0] || null;
  }

  getActiveAddresses(user: User): UserAddress[] {
    return user.addresses.filter(addr => addr.isActive !== false);
  }

  validateAddress(address: Partial<UserAddress>): string[] {
    const errors: string[] = [];
    
    if (!address.label?.trim()) errors.push('Nhãn địa chỉ là bắt buộc');
    if (!address.addressLine?.trim()) errors.push('Địa chỉ chi tiết là bắt buộc');
    if (!address.latitude || !address.longitude) errors.push('Tọa độ địa chỉ là bắt buộc');
    if (!address.city?.trim()) errors.push('Thành phố là bắt buộc');
    if (!address.district?.trim()) errors.push('Quận/huyện là bắt buộc');
    if (!address.ward?.trim()) errors.push('Phường/xã là bắt buộc');
    
    return errors;
  }
}

export const userService = new UserService();
