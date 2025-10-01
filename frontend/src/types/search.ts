export enum SearchType {
  RESTAURANT = 'restaurant',
  ITEM = 'item',
  CATEGORY = 'category',
  GENERAL = 'general',
}

export interface SearchHistory {
  id: string;
  userId?: string;
  query: string;
  type: SearchType;
  location?: string;
  latitude?: number;
  longitude?: number;
  resultCount: number;
  hasResults: boolean;
  clickCount: number;
  clickedResults?: string[];
  conversionCount: number;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  searchRank: number;
  isSuccessful: boolean;
  timeSpent: number;
  referrer?: string;
  filters?: {
    category?: string;
    priceRange?: { min: number; max: number };
    rating?: number;
    distance?: number;
    deliveryTime?: string;
    cuisine?: string[];
    features?: string[];
  };
  deviceType?: string;
  platform?: string;
  appVersion?: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  type: 'restaurant' | 'item' | 'category';
  name: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  price?: number;
  category?: string;
  distance?: number;
  deliveryTime?: string;
  isOpen?: boolean;
  popularityScore?: number;
  tags?: string[];
  highlights?: {
    field: string;
    value: string;
    matched: string;
  }[];
}

export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  distance?: number;
  deliveryTime?: string;
  cuisine?: string[];
  features?: string[];
  sortBy?: 'relevance' | 'rating' | 'price' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: SearchFilters;
  suggestions?: string[];
  relatedSearches?: string[];
  searchTime: number;
}
