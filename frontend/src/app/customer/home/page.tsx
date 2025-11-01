"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CustomerGuard } from "@/components/guards/AuthGuard";
import { useToast, RestaurantCard } from "@/components";
import { useCustomerAuth } from "@/contexts/AuthContext";
import { useDeliveryAddress } from "@/contexts/DeliveryAddressContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import { usePublicCategories } from "@/hooks/useCategories";
import { useFeaturedCollections } from "@/hooks/useFeaturedCollections";
import { useRestaurantDistance } from "@/hooks/useRestaurantDistance";
import { cartService } from "@/services/cart.service";
import { apiClient } from "@/services/api.client";
import useEmblaCarousel from "embla-carousel-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faChevronLeft,
  faChevronRight,
  faStar,
  faTruck,
  faPhone,
  faEnvelope,
  faLocationDot,
  faUtensils,
  faArrowRight,
  faStore,
  faHouse,
  faList,
  faUser,
  faBowlRice,
  faBreadSlice,
  faPizzaSlice,
  faBurger,
  faCoffee,
  faIceCream,
  faCookie,
  faCake,
  faCarrot,
  faFish,
  faDrumstickBite,
  faEgg,
  faCheese,
  faGlassWater,
  faWineGlass,
  faBeer,
  faMugHot,
  faLeaf,
  faSeedling,
  faPepperHot,
  faLemon,
  faGift,
  faHeart,
  faFire,
  faSnowflake,
  faSun,
  faMoon,
  faCloud,
  faUmbrella,
  faTree,
  faGem,
  faCrown,
  faCircle,
  faSquare,
  faDiamond,
  faSpinner,
  faMagic,
  faRocket,
  faPlane,
  faCar,
  faBicycle,
  faShip,
  faTrain,
  faBus,
  faMotorcycle,
  faHelicopter,
  faSubway,
  faTaxi,
  faTractor,
  faTruckPickup,
  faTruckMonster,
  faTruckMoving,
  faTruckLoading,
  faTruckFast,
  faTruckField,
  faTruckFieldUn,
  faTruckFront,
  faTruckMedical,
  faTruckRampBox,
  faTruckDroplet,
  faTruckArrowRight,
  faTruckPlane
} from "@fortawesome/free-solid-svg-icons";
import { faTwitter, faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { haversineKm } from "@/utils/geo";

function CustomerHomeContent() {
  const { user } = useCustomerAuth();
  const { showToast } = useToast();
  const { addressLabel, setAddressLabel, userLocation, setUserLocation } = useDeliveryAddress();
  const pathname = usePathname();
  


  // Icon mapping function
  const getIconComponent = (iconString: string) => {
    if (!iconString) return faUtensils;
    
    // Remove "solid:" prefix if present
    const cleanIcon = iconString.replace('solid:', '');
    
    // Map icon strings to FontAwesome icons
    const iconMap: { [key: string]: any } = {
      'faBowlRice': faBowlRice,
      'faBreadSlice': faBreadSlice,
      'faPizzaSlice': faPizzaSlice,
      'faBurger': faBurger,
      'faCoffee': faCoffee,
      'faIceCream': faIceCream,
      'faCookie': faCookie,
      'faCake': faCake,
      'faCarrot': faCarrot,
      'faFish': faFish,
      'faDrumstickBite': faDrumstickBite,
      'faEgg': faEgg,
      'faCheese': faCheese,
      'faGlassWater': faGlassWater,
      'faWineGlass': faWineGlass,
      'faBeer': faBeer,
      'faMugHot': faMugHot,
      'faLeaf': faLeaf,
      'faSeedling': faSeedling,
      'faPepperHot': faPepperHot,
      'faLemon': faLemon,
      'faGift': faGift,
      'faHeart': faHeart,
      'faFire': faFire,
      'faSnowflake': faSnowflake,
      'faSun': faSun,
      'faMoon': faMoon,
      'faCloud': faCloud,
      'faUmbrella': faUmbrella,
      'faTree': faTree,
      'faGem': faGem,
      'faCrown': faCrown,
      'faStar': faStar,
      'faCircle': faCircle,
      'faSquare': faSquare,
      'faDiamond': faDiamond,
      'faSpinner': faSpinner,
      'faMagic': faMagic,
      'faRocket': faRocket,
      'faPlane': faPlane,
      'faCar': faCar,
      'faBicycle': faBicycle,
      'faShip': faShip,
      'faTrain': faTrain,
      'faBus': faBus,
      'faMotorcycle': faMotorcycle,
      'faTruck': faTruck,
      'faHelicopter': faHelicopter,
      'faSubway': faSubway,
      'faTaxi': faTaxi,
      'faTractor': faTractor,
      'faTruckPickup': faTruckPickup,
      'faTruckMonster': faTruckMonster,
      'faTruckMoving': faTruckMoving,
      'faTruckLoading': faTruckLoading,
      'faTruckFast': faTruckFast,
      'faTruckField': faTruckField,
      'faTruckFieldUn': faTruckFieldUn,
      'faTruckFront': faTruckFront,
      'faTruckMedical': faTruckMedical,
      'faTruckRampBox': faTruckRampBox,
      'faTruckDroplet': faTruckDroplet,
      'faTruckArrowRight': faTruckArrowRight,
      'faTruckPlane': faTruckPlane
    };
    
    return iconMap[cleanIcon] || faUtensils;
  };
  
  // Load data from backend
  const { data: restaurantsData, loading: restaurantsLoading, error: restaurantsError } = useRestaurants(6, 0);
  const { data: categories, loading: categoriesLoading, error: categoriesError } = usePublicCategories();
  const { data: featuredCollections, loading: collectionsLoading, error: collectionsError } = useFeaturedCollections();
  
  // Debug logs removed
  
  const [promotions, setPromotions] = useState<any[]>([]);
  const [addingMap, setAddingMap] = useState<Record<string, boolean>>({});
  const [restaurantMap, setRestaurantMap] = useState<Record<string, { id: string; name: string; rating?: number }>>({});

  // Embla for categories
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: true, containScroll: 'trimSnaps' });
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  // Embla for hero banner carousel
  const [heroEmblaRef, heroEmblaApi] = useEmblaCarousel({ 
    align: 'start', 
    loop: true,
    skipSnaps: false,
    dragFree: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback((index: number) => heroEmblaApi && heroEmblaApi.scrollTo(index), [heroEmblaApi]);

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  // Wrapper function để tính khoảng cách cho từng restaurant trong map
  // Sử dụng hook useRestaurantDistance cho từng item trong list
  const formatDistanceKm = (restaurant: any) => {
    if (!userLocation || restaurant.latitude == null || restaurant.longitude == null) return null;
    const km = haversineKm(
      userLocation.latitude,
      userLocation.longitude,
      restaurant.latitude,
      restaurant.longitude
    );
    if (!isFinite(km)) return null;
    return `${km.toFixed(1)} km`;
  };

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!heroEmblaApi) return;
    onInit(heroEmblaApi);
    onSelect(heroEmblaApi);
    heroEmblaApi.on('reInit', onInit);
    heroEmblaApi.on('select', onSelect);
  }, [heroEmblaApi, onInit, onSelect]);



  // Feature flag: static promotions disabled in production
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SHOW_STATIC_PROMOS === 'true') {
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
    }
  }, []);

  const handleAddToCart = async (itemId: string, restaurantId: string) => {
    try {
      if (!user) {
        window.location.href = '/customer/login';
        return;
      }
      setAddingMap((m) => ({ ...m, [itemId]: true }));
      await cartService.addToCart(restaurantId, { itemId, quantity: 1 }, 'cookie-auth');
      if (typeof window !== 'undefined') {
        showToast('Đã thêm vào giỏ hàng', 'success');
      }
    } catch (error: any) {
      console.error('Add to cart failed:', error?.message || error);
      showToast('Không thể thêm vào giỏ. Vui lòng thử lại.', 'error');
    } finally {
      setAddingMap((m) => ({ ...m, [itemId]: false }));
    }
  };

  // No items on home anymore; restaurant details loaded on their pages

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white py-6 md:py-8 overflow-hidden">
        <div className="container mx-auto px-3 max-w-11xl">
          {/* Hero Banner with Carousel */}
          <div className="relative">
            {/* Main Banner Content */}
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Chào mừng đến với EatNow! 
              </h1>
              <p className="text-base md:text-lg opacity-90 max-w-2xl mx-auto">
                Khám phá hàng ngàn món ăn ngon từ các nhà hàng uy tín
              </p>
            </div>

            {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm hover:bg-opacity-30 transition-all">
                <div className="text-xl md:text-2xl font-bold">{restaurantsData?.total || '0'}+</div>
                <div className="text-xs opacity-80">Nhà hàng</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm hover:bg-opacity-30 transition-all">
                <div className="text-xl md:text-2xl font-bold">{restaurantsData?.total || '0'}+</div>
                <div className="text-xs opacity-80">Lựa chọn</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm hover:bg-opacity-30 transition-all">
                <div className="text-xl md:text-2xl font-bold">25-35'</div>
                <div className="text-xs opacity-80">Giao hàng</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm hover:bg-opacity-30 transition-all">
                <div className="text-xl md:text-2xl font-bold">4.8★</div>
                <div className="text-xs opacity-80">Đánh giá</div>
              </div>
            </div>

            {/* Promotional Banners Carousel */}
            <div className="relative max-w-3xl mx-auto">
              <div className="overflow-hidden" ref={heroEmblaRef}>
                <div className="flex">
                  {/* Suggested Restaurants Banner (replaces items banner) */}
                  <div className="flex-shrink-0 w-full bg-white bg-opacity-10 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="text-center">
                      <h3 className="text-lg font-bold mb-3">⭐ Gợi ý cho bạn</h3>
                      <div className="space-y-2">
                        {restaurantsData?.restaurants && restaurantsData.restaurants.slice(0, 3).map((r: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                              <span className="text-lg">🏪</span>
                            </div>
                            <span className="truncate">{r.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Promotions Banner */}
                  {promotions.length > 0 && promotions.slice(0, 2).map((promo) => (
                    <div key={promo.id} className="flex-shrink-0 w-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="text-center text-white">
                          <div className="text-2xl font-bold mb-2">{promo.discount}</div>
                          <h3 className="text-base font-semibold mb-2">{promo.title}</h3>
                          <p className="text-xs opacity-90">{promo.description}</p>
                          <div className="mt-3 bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-medium">
                            {promo.code}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
                      <div className="absolute bottom-0 left-0 w-12 h-12 bg-white bg-opacity-10 rounded-full translate-y-6 -translate-x-6"></div>
                    </div>
                  ))}

                  {/* Restaurant Highlights */}
                  <div className="flex-shrink-0 w-full bg-white bg-opacity-10 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="text-center">
                      <h3 className="text-lg font-bold mb-3">⭐ Nhà hàng nổi bật</h3>
                      <div className="space-y-2">
                        {restaurantsData?.restaurants && restaurantsData.restaurants.slice(0, 3).map((restaurant, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                              <span className="text-lg">🏪</span>
                            </div>
                            <span className="truncate">{restaurant.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center mt-4 space-x-2">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                    onClick={() => scrollTo(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-3 max-w-7xl">
          <div className="relative">
            {/* Left Arrow */}
            <button
              aria-label="Scroll categories left"
              onClick={scrollPrev}
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow border border-gray-200 items-center justify-center hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5 text-gray-700" />
            </button>

            {/* Embla viewport */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-4">
                {categoriesLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="min-w-[160px] w-[160px] h-[180px] bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse flex flex-col">
                      <div className="text-center flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex-shrink-0"></div>
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
                        className="min-w-[160px] w-[160px] h-[180px] group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 flex flex-col"
                      >
                        <div className="text-center flex flex-col items-center justify-center h-full">
                          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors flex-shrink-0">
                            <FontAwesomeIcon 
                              icon={getIconComponent(category.icon || '')} 
                              className="text-2xl text-orange-600" 
                            />
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                            {category.name}
                          </h3>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href="/customer/restaurants"
                      className="min-w-[160px] w-[160px] h-[180px] bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all flex items-center justify-center"
                    >
                      <span className="text-orange-600 font-semibold">Xem thêm</span>
                    </Link>
                  </>
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-400 text-lg">Chưa có danh mục nào</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              aria-label="Scroll categories right"
              onClick={scrollNext}
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow border border-gray-200 items-center justify-center hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Collections Section */}
      {featuredCollections && featuredCollections.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-3 max-w-7xl">
            {featuredCollections.map((collection) => (
              <div key={collection._id} className="mb-16 last:mb-0">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    {collection.icon && (
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon 
                          icon={getIconComponent(collection.icon)} 
                          className="text-xl text-orange-600" 
                        />
                      </div>
                    )}
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-1">{collection.name}</h2>
                      {collection.subtitle && (
                        <p className="text-lg text-gray-600">{collection.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/customer/restaurants"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center"
                  >
                    Xem tất cả
                    <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5 ml-2" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collection.restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant._id}
                      restaurant={restaurant}
                      distance={formatDistanceKm(restaurant)}
                      showDistance={true}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Items Section removed per new spec: home shows restaurants, not items */}

      {/* Featured Restaurants Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-3 max-w-7xl">
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
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5 ml-2" />
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
                <RestaurantCard
                  key={restaurant._id || restaurant.id}
                  restaurant={restaurant}
                  distance={formatDistanceKm(restaurant)}
                  showDistance={true}
                />
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
          <div className="container mx-auto px-3 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Khuyến mãi hôm nay</h2>
              <Link href="/customer/promotions" className="text-orange-600 font-medium hover:text-orange-700 flex items-center">
                Xem tất cả
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-1" />
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
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors" aria-label="Twitter">
                  <FontAwesomeIcon icon={faTwitter} className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors" aria-label="Facebook">
                  <FontAwesomeIcon icon={faFacebook} className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors" aria-label="Instagram">
                  <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" />
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
                  <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-300 text-sm">1900 1234</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-300 text-sm">support@eatnow.vn</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4 text-orange-500" />
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
    <CustomerHomeContent />
  );
}