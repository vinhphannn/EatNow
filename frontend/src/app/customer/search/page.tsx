"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerGuard } from "@/components/guards/AuthGuard";
import { useToast } from "@/components";
import { useDeliveryAddress } from "@/contexts/DeliveryAddressContext";
import { apiClient } from "@/services/api.client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faArrowLeft,
  faStar,
  faTruck,
  faUtensils,
  faStore,
  faTimes,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

interface SearchResult {
  type: 'restaurant' | 'item';
  restaurant: {
    _id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    rating?: number;
    deliveryFee?: number;
    address?: string;
  };
  item?: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    category?: string;
    rating?: number;
    reviewCount?: number;
  };
  matchedText: string;
  relevanceScore: number;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { addressLabel } = useDeliveryAddress();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Load popular searches
  useEffect(() => {
    setPopularSearches([
      'Phở bò',
      'Bún bò Huế',
      'Cơm tấm',
      'Bánh mì',
      'Pizza',
      'Gà rán',
      'Sushi',
      'Lẩu',
      'Bún chả',
      'Chả cá'
    ]);
  }, []);

  // Real-time search with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // If query is empty, clear results
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    // Set loading state
    setLoading(true);

    // Create new timer for debounced search
    const timer = setTimeout(() => {
      performSearch(query.trim());
    }, 300); // 300ms delay like TikTok

    setDebounceTimer(timer);

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [query]);

  // Update URL when query changes
  useEffect(() => {
    if (query.trim()) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('q', query.trim());
      router.replace(`/customer/search?${newSearchParams.toString()}`, { scroll: false });
    }
  }, [query, searchParams, router]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    try {
      // Search both restaurants and items
      const [restaurantsResponse, itemsResponse] = await Promise.all([
        apiClient.get(`/api/v1/restaurants/search?q=${encodeURIComponent(searchQuery)}&limit=10`),
        apiClient.get(`/api/v1/restaurants/items-search?q=${encodeURIComponent(searchQuery)}&limit=20`)
      ]);

      const searchResults: SearchResult[] = [];

      // Process restaurant results
      if (restaurantsResponse && typeof restaurantsResponse === 'object' && 'restaurants' in restaurantsResponse && Array.isArray(restaurantsResponse.restaurants)) {
        restaurantsResponse.restaurants.forEach((restaurant: any) => {
          searchResults.push({
            type: 'restaurant',
            restaurant: {
              _id: restaurant._id,
              name: restaurant.name,
              description: restaurant.description,
              imageUrl: restaurant.imageUrl,
              rating: restaurant.rating,
              deliveryFee: restaurant.deliveryFee,
              address: restaurant.address
            },
            matchedText: restaurant.name,
            relevanceScore: restaurant.relevanceScore || 0
          });
        });
      }

      // Process item results
      if (itemsResponse && typeof itemsResponse === 'object' && 'items' in itemsResponse && Array.isArray(itemsResponse.items)) {
        itemsResponse.items.forEach((item: any) => {
          searchResults.push({
            type: 'item',
            restaurant: {
              _id: item.restaurant._id,
              name: item.restaurant.name,
              description: item.restaurant.description,
              imageUrl: item.restaurant.imageUrl,
              rating: item.restaurant.rating,
              deliveryFee: item.restaurant.deliveryFee,
              address: item.restaurant.address
            },
            item: {
              _id: item._id,
              name: item.name,
              description: item.description,
              price: item.price,
              imageUrl: item.imageUrl,
              category: item.category
            },
            matchedText: item.name,
            relevanceScore: item.relevanceScore || 0
          });
        });
      }

      // Sort by relevance score
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Group by restaurant and limit to 2 items per restaurant
      const groupedResults = new Map<string, SearchResult[]>();
      searchResults.forEach(result => {
        const restaurantId = result.restaurant._id;
        if (!groupedResults.has(restaurantId)) {
          groupedResults.set(restaurantId, []);
        }
        const group = groupedResults.get(restaurantId)!;
        if (group.length < 3) { // Max 3 results per restaurant (1 restaurant + 2 items)
          group.push(result);
        }
      });

      // Flatten grouped results
      const finalResults: SearchResult[] = [];
      groupedResults.forEach(group => {
        finalResults.push(...group);
      });

      setResults(finalResults.slice(0, 20)); // Limit to 20 total results

    } catch (error) {
      console.error('Search error:', error);
      showToast('Không thể tìm kiếm. Vui lòng thử lại.', 'error');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Handle popular search click
  const handlePopularSearch = (popularQuery: string) => {
    setQuery(popularQuery);
    // Update URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('q', popularQuery);
    router.push(`/customer/search?${newSearchParams.toString()}`);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    router.push('/customer/search');
  };

  // Highlight matched text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b pt-4">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm món ăn, nhà hàng..."
                className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5 text-gray-400" />
              </div>
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-orange-50 border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <FontAwesomeIcon icon={faTruck} className="w-4 h-4" />
            <span>Giao đến: {addressLabel}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {!hasSearched ? (
          /* Popular Searches */
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tìm kiếm phổ biến</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularSearch(search)}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{search}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-12">
            <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-600">Đang tìm kiếm...</p>
          </div>
        ) : results.length > 0 ? (
          /* Search Results */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Kết quả tìm kiếm cho "{query}"
              </h2>
              <span className="text-sm text-gray-500">{results.length} kết quả</span>
            </div>

            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={`${result.type}-${result.restaurant._id}-${index}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Restaurant Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        {result.restaurant.imageUrl ? (
                          <img
                            src={result.restaurant.imageUrl}
                            alt={result.restaurant.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faStore} className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Restaurant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              <span dangerouslySetInnerHTML={{
                                __html: highlightText(result.restaurant.name, query)
                              }} />
                            </h3>
                            
                            {result.type === 'item' && result.item && (
                              <div className="mt-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-200">
                                <div className="flex items-start gap-3">
                                  {/* Item Image - smaller than restaurant */}
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                    {result.item.imageUrl ? (
                                      <img
                                        src={result.item.imageUrl}
                                        alt={result.item.name}
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                    ) : (
                                      <FontAwesomeIcon icon={faUtensils} className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>

                                  {/* Item Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <FontAwesomeIcon icon={faUtensils} className="w-3 h-3 text-orange-500" />
                                      <span className="text-xs font-medium text-orange-600">Món ăn</span>
                                    </div>

                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      <span dangerouslySetInnerHTML={{
                                        __html: highlightText(result.item.name, query)
                                      }} />
                                    </p>
                                    
                                    {result.item.description && (
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {result.item.description}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-bold text-orange-600">
                                        {result.item.price.toLocaleString('vi-VN')}đ
                                      </p>
                                      {(result.item.rating > 0) && (
                                        <div className="flex items-center gap-1">
                                          <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-yellow-500" />
                                          <span className="text-xs text-gray-600">{result.item.rating}</span>
                                          {result.item.reviewCount > 0 && (
                                            <span className="text-xs text-gray-400">({result.item.reviewCount})</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {result.restaurant.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {result.restaurant.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {result.restaurant.rating && (
                                <span className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                                  {result.restaurant.rating}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faTruck} />
                                {result.restaurant.deliveryFee ? `${result.restaurant.deliveryFee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => router.push(`/customer/restaurants/${result.restaurant._id}`)}
                            className="ml-4 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            Xem menu
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-600 mb-6">
              Không tìm thấy món ăn hoặc nhà hàng nào cho "{query}"
            </p>
            <button
              onClick={clearSearch}
              className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
            >
              Thử tìm kiếm khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <CustomerGuard>
      <SearchContent />
    </CustomerGuard>
  );
}