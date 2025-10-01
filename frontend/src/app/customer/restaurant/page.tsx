"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerNavBar } from "@/components";

export default function RestaurantListPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("rating");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "Tất cả", "Pizza", "Burger", "Gà rán", "Phở", "Bún", "Sushi", "Cafe", "Trà sữa"
  ];

  const restaurants = [
    {
      id: 1,
      name: "Pizza Hut",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
      rating: 4.5,
      reviewCount: 1240,
      deliveryTime: "25-35 phút",
      deliveryFee: "15,000đ",
      minOrder: "50,000đ",
      category: "Pizza",
      distance: "0.8 km",
      tags: ["Pizza", "Mỹ", "Gia đình"],
      discount: "Giảm 20%",
      isPromoted: true
    },
    {
      id: 2,
      name: "KFC",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
      rating: 4.3,
      reviewCount: 890,
      deliveryTime: "20-30 phút",
      deliveryFee: "Miễn phí",
      minOrder: "30,000đ",
      category: "Gà rán",
      distance: "1.2 km",
      tags: ["Gà rán", "Mỹ", "Nhanh"],
      discount: "Miễn phí ship",
      isPromoted: false
    },
    {
      id: 3,
      name: "McDonald's",
      image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
      rating: 4.2,
      reviewCount: 2100,
      deliveryTime: "15-25 phút",
      deliveryFee: "12,000đ",
      minOrder: "40,000đ",
      category: "Burger",
      distance: "0.5 km",
      tags: ["Burger", "Mỹ", "Nhanh"],
      discount: "Combo 50k",
      isPromoted: true
    },
    {
      id: 4,
      name: "Phở 24",
      image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400",
      rating: 4.7,
      reviewCount: 560,
      deliveryTime: "20-30 phút",
      deliveryFee: "18,000đ",
      minOrder: "60,000đ",
      category: "Phở",
      distance: "1.5 km",
      tags: ["Phở", "Việt Nam", "Truyền thống"],
      discount: "Giảm 15%",
      isPromoted: false
    },
    {
      id: 5,
      name: "Bún Bò Huế",
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400",
      rating: 4.6,
      reviewCount: 320,
      deliveryTime: "25-35 phút",
      deliveryFee: "20,000đ",
      minOrder: "45,000đ",
      category: "Bún",
      distance: "2.1 km",
      tags: ["Bún", "Việt Nam", "Cay"],
      discount: "Mua 1 tặng 1",
      isPromoted: true
    },
    {
      id: 6,
      name: "Sushi Hokkaido",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
      rating: 4.8,
      reviewCount: 180,
      deliveryTime: "30-45 phút",
      deliveryFee: "25,000đ",
      minOrder: "100,000đ",
      category: "Sushi",
      distance: "3.2 km",
      tags: ["Sushi", "Nhật", "Cao cấp"],
      discount: "Giảm 25%",
      isPromoted: false
    }
  ];

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesCategory = selectedCategory === "Tất cả" || restaurant.category === selectedCategory;
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "deliveryTime":
        return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      case "distance":
        return parseFloat(a.distance) - parseFloat(b.distance);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavBar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nhà hàng gần bạn
          </h1>
          <p className="text-gray-600">
            Khám phá các nhà hàng ngon và đặt món ngay
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm nhà hàng, món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Danh mục</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="rating">Đánh giá cao</option>
                <option value="deliveryTime">Thời gian giao</option>
                <option value="distance">Khoảng cách</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {sortedRestaurants.length} nhà hàng
            </div>
          </div>
        </div>

        {/* Restaurant List */}
        <div className="space-y-4">
          {sortedRestaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/customer/restaurant/${restaurant.id}`}
              className="block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="flex">
                {/* Restaurant Image */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  {restaurant.isPromoted && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                      🔥 Hot
                    </div>
                  )}
                  {restaurant.discount && (
                    <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                      {restaurant.discount}
                    </div>
                  )}
                </div>

                {/* Restaurant Info */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center bg-white rounded-lg px-2 py-1 shadow-sm">
                      <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium">{restaurant.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {restaurant.deliveryTime}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {restaurant.distance}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {restaurant.reviewCount} đánh giá
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Phí ship: {restaurant.deliveryFee}</span>
                      <span>Tối thiểu: {restaurant.minOrder}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More */}
        {sortedRestaurants.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-8 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors">
              Xem thêm nhà hàng
            </button>
          </div>
        )}

        {/* No Results */}
        {sortedRestaurants.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Không tìm thấy nhà hàng
            </h3>
            <p className="text-gray-600 mb-4">
              Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Tất cả");
              }}
              className="px-6 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
            >
              Xem tất cả
            </button>
          </div>
        )}
      </div>
    </div>
  );
}