"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CustomerGuard } from "@/components/guards/AuthGuard";
import { useCustomerAuth } from "@/contexts/AuthContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useAllItems } from "@/hooks/useItems";
import { usePublicCategories } from "@/hooks/useCategories";
import { cartService } from "@/services/cart.service";
import useEmblaCarousel from "embla-carousel-react";

function CustomerHomeContent() {
  const { user } = useCustomerAuth();
  
  // Load data from backend
  const { data: restaurantsData, loading: restaurantsLoading, error: restaurantsError } = useRestaurants(6, 0);
  const { data: allItems, loading: itemsLoading, error: itemsError } = useAllItems(8, 0);
  const { data: categories, loading: categoriesLoading, error: categoriesError } = usePublicCategories();
  
  // Debug logs
  console.log('Home page data:', {
    restaurantsData,
    allItems,
    categories,
    restaurantsLoading,
    itemsLoading,
    categoriesLoading
  });
  
  const [promotions, setPromotions] = useState<any[]>([]);
  const [addingMap, setAddingMap] = useState<Record<string, boolean>>({});

  // Embla for categories
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: true, containScroll: 'trimSnaps' });
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  // Load static promotions data
  useEffect(() => {
        setPromotions([
          {
            id: '1',
            title: 'Giảm 50% cho đơn đầu tiên',
            description: 'Áp dụng cho tất cả nhà hàng',
            discount: '50%',
            code: 'WELCOME50',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
            validUntil: '2024-12-31'
          },
          {
            id: '2',
            title: 'Miễn phí giao hàng',
            description: 'Cho đơn từ 200k',
            discount: '0đ',
            code: 'FREESHIP',
            image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
            validUntil: '2024-12-31'
          }
        ]);
  }, []);

  const handleAddToCart = async (itemId: string) => {
    try {
      if (!user) {
        window.location.href = '/customer/login';
        return;
      }
      setAddingMap((m) => ({ ...m, [itemId]: true }));
      await cartService.addToCart({ itemId, quantity: 1 }, 'cookie-auth');
      if (typeof window !== 'undefined') {
        alert('Đã thêm vào giỏ hàng');
      }
    } catch (error: any) {
      console.error('Add to cart failed:', error?.message || error);
      alert('Không thể thêm vào giỏ. Vui lòng thử lại.');
    } finally {
      setAddingMap((m) => ({ ...m, [itemId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Chào mừng đến với EatNow! 🍽️
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Khám phá hàng ngàn món ăn ngon từ các nhà hàng uy tín, giao hàng nhanh chóng và tiện lợi
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm món ăn, nhà hàng..."
                  className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{restaurantsData?.total || '0'}+</div>
                <div className="text-sm opacity-80">Nhà hàng</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{allItems?.length || '0'}+</div>
                <div className="text-sm opacity-80">Món ăn</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">25-35'</div>
                <div className="text-sm opacity-80">Giao hàng</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">4.8★</div>
                <div className="text-sm opacity-80">Đánh giá</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Danh mục món ăn</h2>
              <p className="text-xl text-gray-600">Kéo ngang hoặc dùng mũi tên để xem thêm</p>
            </div>
            <Link href="/customer/restaurants" className="hidden md:inline-flex bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50">Xem tất cả</Link>
          </div>
          
          <div className="relative">
            {/* Left Arrow */}
            <button
              aria-label="Scroll categories left"
              onClick={scrollPrev}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow border border-gray-200 items-center justify-center hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>

            {/* Embla viewport */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {categoriesLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="min-w-[160px] bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      </div>
                    </div>
                  ))
                ) : categories && categories.length > 0 ? (
                  <>
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/customer/restaurants?category=${encodeURIComponent(category.name)}`}
                        className="min-w-[160px] group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200"
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                            <span className="text-2xl">{category.icon || '🍽️'}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {category.name}
                          </h3>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href="/customer/restaurants"
                      className="min-w-[160px] bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all flex items-center justify-center"
                    >
                      <span className="text-orange-600 font-semibold">Xem thêm</span>
                    </Link>
                  </>
                ) : (
                  [
                    { _id: '1', name: 'Món Việt', icon: '🍜' },
                    { _id: '2', name: 'Pizza', icon: '🍕' },
                    { _id: '3', name: 'Burger', icon: '🍔' },
                    { _id: '4', name: 'Sushi', icon: '🍣' },
                    { _id: '5', name: 'Trà sữa', icon: '🧋' },
                    { _id: '6', name: 'Cà phê', icon: '☕' },
                  ].map((category) => (
                    <Link
                      key={category._id}
                      href={`/customer/restaurants?category=${encodeURIComponent(category.name)}`}
                      className="min-w-[160px] group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {category.name}
                        </h3>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              aria-label="Scroll categories right"
              onClick={scrollNext}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow border border-gray-200 items-center justify-center hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Món ăn nổi bật</h2>
              <p className="text-xl text-gray-600">Những món ăn được yêu thích nhất</p>
            </div>
            <Link
              href="/customer/restaurants"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center"
            >
              Xem tất cả
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {itemsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : allItems && allItems.length > 0 ? (
              allItems.slice(0, 30).map((item) => (
                <div key={item._id || item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl">🍽️</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-600 font-bold text-lg">
                        {item.price.toLocaleString('vi-VN')}đ
                      </span>
                      <button
                        onClick={() => handleAddToCart(item._id || item.id || '')}
                        disabled={addingMap[item._id || item.id || '']}
                        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {addingMap[item._id || item.id || ''] ? 'Đang thêm...' : 'Thêm'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 text-lg">Chưa có món ăn nào</div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Featured Restaurants Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Nhà hàng nổi bật</h2>
              <p className="text-xl text-gray-600">Những nhà hàng được yêu thích nhất</p>
            </div>
            <Link
              href="/customer/restaurants"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center"
            >
              Xem tất cả
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurantsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : restaurantsData?.restaurants && restaurantsData.restaurants.length > 0 ? (
              restaurantsData.restaurants.slice(0, 5).map((restaurant) => (
                <Link
                  key={restaurant._id || restaurant.id}
                  href={`/customer/restaurants/${restaurant._id || restaurant.id}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                  prefetch={false}
                >
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    {restaurant.imageUrl ? (
                      <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl">🏪</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {restaurant.name}
                      </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>⭐ {restaurant.rating || '4.5'}</span>
                      <span>🚚 {restaurant.deliveryFee ? `${restaurant.deliveryFee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 text-lg">Chưa có nhà hàng nào</div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      {promotions.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Khuyến mãi hôm nay</h2>
              <Link href="/customer/promotions" className="text-orange-600 font-medium hover:text-orange-700 flex items-center">
                Xem tất cả
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promotions.map((promo) => (
                <div key={promo.id} className="relative bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl overflow-hidden">
                  <div className="p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                        {promo.code}
                      </span>
                      <span className="text-2xl font-bold">{promo.discount}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{promo.title}</h3>
                    <p className="text-orange-100 mb-4">{promo.description}</p>
                    <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
                      Sử dụng ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <h3 className="text-2xl font-bold">EatNow</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Nền tảng giao đồ ăn hàng đầu Việt Nam. Kết nối bạn với hàng ngàn nhà hàng uy tín, 
                giao hàng nhanh chóng và tiện lợi.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.41-.439c.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Liên kết nhanh</h4>
              <ul className="space-y-2">
                <li><a href="/customer/restaurants" className="text-gray-300 hover:text-orange-500 transition-colors">Tìm nhà hàng</a></li>
                <li><a href="/customer/promotions" className="text-gray-300 hover:text-orange-500 transition-colors">Khuyến mãi</a></li>
                <li><a href="/customer/orders" className="text-gray-300 hover:text-orange-500 transition-colors">Đơn hàng của tôi</a></li>
                <li><a href="/customer/profile" className="text-gray-300 hover:text-orange-500 transition-colors">Tài khoản</a></li>
                <li><a href="/customer/address" className="text-gray-300 hover:text-orange-500 transition-colors">Địa chỉ</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Hỗ trợ</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-orange-500 transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-500 transition-colors">Liên hệ</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-500 transition-colors">Báo cáo sự cố</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-500 transition-colors">Điều khoản sử dụng</a></li>
                <li><a href="#" className="text-gray-300 hover:text-orange-500 transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Liên hệ</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-300 text-sm">1900 1234</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-300 text-sm">support@eatnow.vn</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-300 text-sm">TP. Hồ Chí Minh, Việt Nam</span>
                </div>
              </div>
              
              {/* Download App */}
              <div className="pt-4">
                <h5 className="text-sm font-semibold mb-3">Tải ứng dụng</h5>
                <div className="flex space-x-2">
                  <a href="#" className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-400">Tải về</div>
                      <div className="text-sm font-medium">App Store</div>
                    </div>
                  </a>
                  <a href="#" className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.353 2.353-1.06 1.06-2.353-2.353-2.353 2.353-1.06-1.06 2.353-2.353-2.353-2.353 1.06-1.06 2.353 2.353 2.353-2.353 1.06 1.06-2.353 2.353z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-400">Tải về</div>
                      <div className="text-sm font-medium">Google Play</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 EatNow. Tất cả quyền được bảo lưu.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Điều khoản</a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Bảo mật</a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Cookie</a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Sitemap</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CustomerHomePage() {
  return (
    <CustomerGuard>
      <CustomerHomeContent />
    </CustomerGuard>
  );
}