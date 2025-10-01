"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { restaurantService, Restaurant } from "@modules/restaurant/services";
import { categoryService, Category } from "@/services/category.service";
import SearchBar from "@/components/search/SearchBar";
import FavoriteButton from "@/components/favorites/FavoriteButton";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    distance: '',
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, filters]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would call a search API
      // For now, we'll filter restaurants based on the query
      const [restaurantsData, categoriesData] = await Promise.all([
        restaurantService.getRestaurant().then(r => [r]).catch(() => []),
        Promise.resolve([]), // Mock categories
      ]);

      let filteredRestaurants = restaurantsData;

      // Filter by search query
      if (query) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
          restaurant.description.toLowerCase().includes(query.toLowerCase()) ||
          restaurant.category.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Filter by category
      if (filters.category) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.category === filters.category
        );
      }

      // Filter by rating
      if (filters.rating) {
        const minRating = parseFloat(filters.rating);
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.rating >= minRating
        );
      }

      // Sort results
      filteredRestaurants.sort((a, b) => {
        switch (filters.sortBy) {
          case 'rating':
            return filters.sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating;
          case 'name':
            return filters.sortOrder === 'desc' 
              ? b.name.localeCompare(a.name)
              : a.name.localeCompare(b.name);
          case 'distance':
            // Mock distance calculation
            return Math.random() - 0.5;
          default:
            return 0;
        }
      });

      setRestaurants(filteredRestaurants);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    // Update URL
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    router.push(`/customer/search?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      distance: '',
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <SearchBar
                placeholder="Tìm kiếm món ăn, nhà hàng..."
                onSearch={handleSearch}
                showSuggestions={true}
                autoFocus={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xóa tất cả
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đánh giá tối thiểu
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Tất cả đánh giá</option>
                  <option value="4">4+ sao</option>
                  <option value="3">3+ sao</option>
                  <option value="2">2+ sao</option>
                  <option value="1">1+ sao</option>
                </select>
              </div>

              {/* Distance Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng cách
                </label>
                <select
                  value={filters.distance}
                  onChange={(e) => handleFilterChange('distance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Tất cả khoảng cách</option>
                  <option value="1">Dưới 1km</option>
                  <option value="3">Dưới 3km</option>
                  <option value="5">Dưới 5km</option>
                  <option value="10">Dưới 10km</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {query ? `Kết quả tìm kiếm cho "${query}"` : 'Tất cả nhà hàng'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tìm thấy {restaurants.length} nhà hàng
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Sắp xếp theo:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="relevance">Liên quan</option>
                    <option value="rating">Đánh giá</option>
                    <option value="name">Tên</option>
                    <option value="distance">Khoảng cách</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="desc">Giảm dần</option>
                    <option value="asc">Tăng dần</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy kết quả</h3>
                <p className="text-gray-600">
                  {query ? `Không có nhà hàng nào phù hợp với "${query}"` : 'Hãy thử tìm kiếm với từ khóa khác'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <div key={restaurant._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative">
                      <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        {restaurant.isOpen ? (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Đang mở
                          </span>
                        ) : (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            Đã đóng
                          </span>
                        )}
                        <FavoriteButton
                          type="restaurant"
                          targetId={restaurant._id}
                          targetName={restaurant.name}
                          size="sm"
                          className="bg-white/90 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {restaurant.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {restaurant.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">⭐</span>
                          <span className="text-gray-600">
                            {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'Chưa có đánh giá'}
                          </span>
                        </div>
                        <span className="text-gray-500">{restaurant.deliveryTime}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {restaurant.category}
                        </span>
                        <button
                          onClick={() => router.push(`/customer/restaurant/${restaurant._id}`)}
                          className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                        >
                          Xem menu →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
