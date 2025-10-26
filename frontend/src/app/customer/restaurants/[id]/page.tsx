"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CustomerGuard } from "@/components/guards/AuthGuard";
import { apiClient } from "@/services/api.client";
import { useCategoriesByRestaurant } from "@/hooks/useCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faStar, faTruck, faUtensils } from "@fortawesome/free-solid-svg-icons";
import { cartService } from "@/services/cart.service";
import { useToast } from "@/components";
import { ItemOptionsDialog } from "@/components/ItemOptionsDialog";
import { calculateCartSummary, getCartDisplayInfo } from "@/utils/cartUtils";

interface RestaurantInfo {
  id: string;
  name: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  rating?: number;
  deliveryFee?: number;
  isOpen?: boolean;
}

interface ItemData {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  categoryId?: string;
  options?: Array<{
    id: string;
    name: string;
    type: 'single' | 'multiple';
    required: boolean;
    choices: Array<{
      id: string;
      name: string;
      price: number;
      isDefault: boolean;
      isActive: boolean;
    }>;
  }>;
}

function RestaurantDetailContent() {
  const params = useParams();
  const restaurantId = String(params?.id || "");
  const search = useSearchParams();
  const initialCategory = search?.get("categoryId") || undefined;
  const { showToast } = useToast();

  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [items, setItems] = useState<ItemData[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [popularItems, setPopularItems] = useState<ItemData[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(initialCategory);

  // Options dialog state
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);

  const { data: categories, loading: categoriesLoading } = useCategoriesByRestaurant(restaurantId);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        setLoadingRestaurant(true);
        const data: any = await apiClient.get(`/api/v1/restaurants/${restaurantId}`);
        setRestaurant({
          id: data?.id || restaurantId,
          name: data?.name,
          description: data?.description,
          address: data?.address,
          imageUrl: data?.imageUrl,
          rating: data?.rating,
          deliveryFee: data?.deliveryFee,
          isOpen: (data as any)?.isOpen,
        });
      } catch (e) {
        setRestaurant(null);
      } finally {
        setLoadingRestaurant(false);
      }
    };
    if (restaurantId) loadRestaurant();
  }, [restaurantId]);

  const loadItems = async (categoryId?: string) => {
    try {
      setLoadingItems(true);
      const qs = new URLSearchParams();
      if (categoryId) qs.set("categoryId", categoryId);
      const data: any = await apiClient.get(`/api/v1/restaurants/${restaurantId}/items${qs.toString() ? `?${qs.toString()}` : ""}`);
      const mapped = Array.isArray(data)        ? data.map((d: any) => ({ 
            id: d.id || d._id, 
            name: d.name, 
            price: d.price, 
            imageUrl: d.imageUrl, 
            description: d.description, 
            categoryId: d.categoryId,
            options: d.options || []
          }))
        : [];
      setItems(mapped);
    } catch (e) {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;
    loadItems(activeCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, activeCategoryId]);

  // Load popular items (independent of category)
  useEffect(() => {
    const loadPopular = async () => {
      if (!restaurantId) return;
      try {
        setLoadingPopular(true);
        const data: any = await apiClient.get(`/api/v1/restaurants/${restaurantId}/items?limit=100`);
        const mapped = Array.isArray(data)
          ? data.map((d: any) => ({ 
              id: d.id || d._id, 
              name: d.name, 
              price: d.price, 
              imageUrl: d.imageUrl, 
              description: d.description, 
              categoryId: d.categoryId, 
              rating: d.rating, 
              reviewCount: d.reviewCount, 
              popularityScore: d.popularityScore,
              options: d.options || []
            }))
          : [];
        // Sort by rating -> reviewCount -> popularityScore
        const sorted = mapped.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0) || (b.popularityScore || 0) - (a.popularityScore || 0));
        setPopularItems(sorted.slice(0, 10));
      } catch (e) {
        setPopularItems([]);
      } finally {
        setLoadingPopular(false);
      }
    };
    loadPopular();
  }, [restaurantId]);

  const header = useMemo(() => {
    if (loadingRestaurant) {
      return (
        <div className="h-48 bg-gray-200 animate-pulse rounded-xl" />
      );
    }
    if (!restaurant) return null;
    return (
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-56 bg-gray-100">
          {restaurant.imageUrl ? (
            <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <FontAwesomeIcon icon={faUtensils} className="text-5xl" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-gray-600 mt-1 max-w-3xl">{restaurant.description}</p>
              )}
              {restaurant.address && (
                <p className="text-gray-500 text-sm mt-1">{restaurant.address}</p>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span className="flex items-center gap-1"><FontAwesomeIcon icon={faStar} className="text-yellow-500" /> {restaurant.rating ?? '4.5'}</span>
              <span className="flex items-center gap-1"><FontAwesomeIcon icon={faTruck} /> {restaurant.deliveryFee ? `${restaurant.deliveryFee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [loadingRestaurant, restaurant]);

  const handleAdd = async (itemId: string) => {
    // Find the item to check if it has options
    const item = [...items, ...popularItems].find(i => i.id === itemId);
    
    if (item && item.options && item.options.length > 0) {
      // Show options dialog
      setSelectedItem(item);
      setShowOptionsDialog(true);
    } else {
      // Add directly to cart
      await addToCart(itemId, {});
    }
  };

  const addToCart = async (itemId: string, selectedOptions: Record<string, string[]>) => {
    try {
      setIsAddingToCart(itemId);
      console.log('Adding to cart:', { restaurantId, itemId, selectedOptions });
      
      // Test auth first - use a simple endpoint
      try {
        const authTest = await apiClient.get('/api/v1/auth/me');
        console.log('Auth test result:', authTest);
      } catch (authError) {
        console.error('Auth test failed:', authError);
        showToast('Bạn cần đăng nhập để thêm vào giỏ hàng', 'error');
        return;
      }
      
      const result = await cartService.addToCart(restaurantId, { itemId, quantity: 1, options: selectedOptions }, 'cookie-auth');
      console.log('Add to cart result:', result);
      showToast('Đã thêm vào giỏ', 'success');
      
      // Refresh cart summary immediately
      await loadCartSummary();
    } catch (e) {
      console.error('Add to cart error:', e);
      showToast(`Không thể thêm vào giỏ: ${e.message}`, 'error');
    } finally {
      setIsAddingToCart(null);
    }
  };

  // Function to load cart summary
  const loadCartSummary = async () => {
    try {
      const cart = await cartService.getCart(restaurantId, 'cookie-auth');
      console.log('🛒 Cart data after add:', cart); // Debug log
      
      // Sử dụng utils để tính toán chính xác
      const summary = calculateCartSummary(cart);
      console.log('📊 Calculated summary after add:', summary); // Debug log
      
      setCartSummary({ 
        count: summary.count, 
        total: summary.total 
      });
      
      // Trigger animation
      setCartAnimation(true);
      setTimeout(() => setCartAnimation(false), 300);
    } catch (error) {
      console.error('❌ Error loading cart after add:', error);
      // Don't reset to 0, keep current state
    }
  };

  const handleOptionsConfirm = (selectedOptions: Record<string, string[]>) => {
    if (selectedItem) {
      addToCart(selectedItem.id, selectedOptions);
      setShowOptionsDialog(false);
      setSelectedItem(null);
    }
  };

  // Bottom cart bar state
  const [cartSummary, setCartSummary] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  const [cartAnimation, setCartAnimation] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const cart = await cartService.getCart(restaurantId, 'cookie-auth');
        console.log('🛒 Cart data:', cart); // Debug log
        
        // Sử dụng utils để tính toán chính xác
        const summary = calculateCartSummary(cart);
        console.log('📊 Calculated summary:', summary); // Debug log
        
        setCartSummary({ 
          count: summary.count, 
          total: summary.total 
        });
      } catch (error) {
        console.error('❌ Error loading cart:', error);
        setCartSummary({ count: 0, total: 0 });
      }
    };
    loadSummary();
  }, [restaurantId]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="container mx-auto px-3 max-w-7xl py-6">
        <div className="mb-4">
          <Link href="/customer/home" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
            Quay lại
          </Link>
        </div>

        {header}

        {/* Popular items (horizontal scroll) */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Món phổ biến</h2>
          {loadingPopular ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="min-w-[220px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-28 bg-gray-200" />
                  <div className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : popularItems.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {popularItems.map((item) => (
                <div key={item.id} className="min-w-[220px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-28 bg-gray-100 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <FontAwesomeIcon icon={faUtensils} className="text-2xl text-gray-400" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-600 font-bold text-sm">{item.price?.toLocaleString('vi-VN')}đ</span>
                      <button
                        onClick={() => handleAdd(item.id)}
                        disabled={isAddingToCart === item.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isAddingToCart === item.id 
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        {isAddingToCart === item.id ? 'Đang thêm...' : 'Thêm'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Chưa có món phổ biến</div>
          )}
        </div>

        {/* Categories filter */}
        <div className="mt-6">
          {categoriesLoading ? (
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-9 w-24 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-full border text-sm ${!activeCategoryId ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setActiveCategoryId(undefined)}
              >
                Tất cả
              </button>
              {categories.map((c: any) => (
                <button
                  key={String(c.id || c._id)}
                  className={`px-4 py-2 rounded-full border text-sm ${activeCategoryId === String(c.id || c._id) ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => setActiveCategoryId(String(c.id || c._id))}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Items grid */}
        <div className="mt-6">
          {loadingItems ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <FontAwesomeIcon icon={faUtensils} className="text-3xl text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-orange-600 font-bold">{item.price?.toLocaleString('vi-VN')}đ</span>
                      <button
                        onClick={() => handleAdd(item.id)}
                        disabled={isAddingToCart === item.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isAddingToCart === item.id 
                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        {isAddingToCart === item.id ? 'Đang thêm...' : 'Thêm'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">Chưa có món nào</div>
          )}
        </div>
      </div>

      {/* Bottom cart navbar */}
      <nav className={`fixed bottom-8 left-0 right-0 z-50 flex justify-center transition-all duration-300 ease-out ${cartSummary.count > 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className={`w-[94%] max-w-xl bg-white border border-gray-200 shadow-xl rounded-2xl px-5 py-3 transition-all duration-300 ${cartAnimation ? 'scale-105 shadow-2xl' : ''}`}>
          <div className="flex items-center justify-between">
            <Link href="/customer/home" className="flex items-center gap-3">
              <div className="relative">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 text-lg">🛒</span>
                {cartSummary.count > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] leading-none flex items-center justify-center font-bold transition-all duration-300 ${cartAnimation ? 'scale-110' : ''}`}>
                    {cartSummary.count}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">
                  {cartSummary.count > 0 ? `${cartSummary.count} món` : 'Giỏ hàng'}
                </div>
                {cartSummary.total > 0 && (
                  <div className="text-xs text-gray-500">
                    {cartSummary.total.toLocaleString('vi-VN')}đ
                  </div>
                )}
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {cartSummary.count > 0 && (
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {cartSummary.total.toLocaleString('vi-VN')}đ
                  </div>
                  <div className="text-xs text-gray-500">Tổng cộng</div>
                </div>
              )}
              <Link
                href={cartSummary.count > 0 ? `/customer/checkout?restaurantId=${restaurantId}` : "/customer/home"}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${cartSummary.count > 0 ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg' : 'bg-gray-100 text-gray-500'}`}
              >
                {cartSummary.count > 0 ? 'Đặt hàng' : 'Giao hàng'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Options Dialog */}
      {selectedItem && (
        <ItemOptionsDialog
          isOpen={showOptionsDialog}
          onClose={() => {
            setShowOptionsDialog(false);
            setSelectedItem(null);
          }}
          onConfirm={handleOptionsConfirm}
          itemName={selectedItem.name}
          itemPrice={selectedItem.price}
          options={selectedItem.options || []}
        />
      )}
    </div>
  );
}

export default function RestaurantDetailPage() {
  return (
    <CustomerGuard>
      <RestaurantDetailContent />
    </CustomerGuard>
  );
}


