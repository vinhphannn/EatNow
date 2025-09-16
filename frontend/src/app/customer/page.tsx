"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "../../components";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  status: string;
  imageUrl?: string;
  items?: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  type: 'food' | 'drink';
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export default function CustomerPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'pop';
  const { showToast, ToastContainer } = useToast();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartLoading, setCartLoading] = useState(false);

  // Load recommended items (30 most popular items) and restaurants
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Get all restaurants (not just active ones for now)
        console.log('Fetching restaurants from:', `${api}/restaurants`);
        const restaurantsRes = await fetch(`${api}/restaurants`);
        console.log('Restaurants response status:', restaurantsRes.status);
        if (!restaurantsRes.ok) {
          console.error('Failed to fetch restaurants:', restaurantsRes.status, await restaurantsRes.text());
          return;
        }
        
        const restaurantsData = await restaurantsRes.json();
        console.log('Restaurants data received:', restaurantsData);
        const allItems: any[] = [];
        const restaurantsWithItems: Restaurant[] = [];

        // Load all menu items from all restaurants
        for (const restaurant of restaurantsData) {
          try {
            // Load items for recommended section (sorted by popularity)
            console.log(`Loading items for restaurant: ${restaurant.name} (${restaurant.id})`);
            const popularItemsRes = await fetch(`${api}/restaurants/${restaurant.id}/items?isActive=true&sortBy=popularityScore&order=desc`);
            console.log(`Items response status for ${restaurant.name}:`, popularItemsRes.status);
            if (popularItemsRes.ok) {
              const popularItems = await popularItemsRes.json();
              console.log(`Found ${popularItems.length} items for ${restaurant.name}:`, popularItems);
              const itemsWithRestaurant = popularItems.map((item: any) => ({
                ...item,
                restaurant: {
                  id: restaurant.id,
                  name: restaurant.name,
                  description: restaurant.description,
                  address: restaurant.address,
                  imageUrl: restaurant.imageUrl
                }
              }));
              allItems.push(...itemsWithRestaurant);
            } else {
              console.log(`Failed to load items for ${restaurant.name}:`, popularItemsRes.status);
            }

            // Load items for restaurant cards (sorted by position)
            const itemsRes = await fetch(`${api}/restaurants/${restaurant.id}/items?isActive=true&sortBy=position&order=asc`);
            if (itemsRes.ok) {
              const items = await itemsRes.json();
              restaurantsWithItems.push({
                ...restaurant,
                items: items.slice(0, 6) // Show max 6 items per restaurant
              });
            } else {
              restaurantsWithItems.push({ ...restaurant, items: [] });
            }
          } catch (error) {
            console.error(`Error loading items for ${restaurant.name}:`, error);
            restaurantsWithItems.push({ ...restaurant, items: [] });
          }
        }

        // Sort all items by popularity score and take max 30 items
        const sortedItems = allItems
          .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
          .slice(0, 30); // Always take max 30 items

        console.log('=== DEBUG RECOMMENDED ITEMS ===');
        console.log('Total restaurants found:', restaurantsData.length);
        console.log('Total items collected:', allItems.length);
        console.log('Items after sorting and slicing:', sortedItems.length);
        console.log('First few items:', sortedItems.slice(0, 3));

        setRecommendedItems(sortedItems);
        setRestaurants(restaurantsWithItems);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    async function searchItems() {
      setSearchLoading(true);
      try {
        const res = await fetch(`${api}/search/items?q=${encodeURIComponent(query)}&size=20`);
        if (res.ok) {
          const results = await res.json();
          setSearchResults(results);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }

    const timeoutId = setTimeout(searchItems, 100); // Debounce search - tìm ngay sau mỗi ký tự
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Cart functions
  const addToCart = async (itemId: string) => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) {
      showToast('Vui lòng đăng nhập để thêm vào giỏ hàng', 'error');
      return;
    }

    setCartLoading(true);
    try {
      const response = await fetch(`${api}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId, quantity: 1 })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Added to cart:', result);
        // Show success message
        showToast('Đã thêm vào giỏ hàng!', 'success');
        // Refresh cart
        loadCart();
      } else {
        const error = await response.text();
        console.error('Add to cart failed:', error);
        showToast('Không thể thêm vào giỏ hàng', 'error');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showToast('Có lỗi xảy ra khi thêm vào giỏ hàng', 'error');
    } finally {
      setCartLoading(false);
    }
  };

  const buyNow = async (itemId: string) => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) {
      showToast('Vui lòng đăng nhập để mua hàng', 'error');
      return;
    }

    // Add to cart first, then redirect to checkout
    await addToCart(itemId);
    // Redirect to checkout page (you can implement this later)
    window.location.href = '/customer/checkout';
  };

  const loadCart = async () => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) return;

    try {
      const response = await fetch(`${api}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const cart = await response.json();
        setCartItems(cart);
      }
    } catch (error) {
      console.error('Load cart error:', error);
    }
  };

  // Load cart on component mount
  useEffect(() => {
    loadCart();
  }, []);

  // Filter restaurants based on search query
  const filteredRestaurants = restaurants.filter(restaurant => {
    if (!query.trim()) return true;
    
    const queryLower = query.toLowerCase();
    const inName = restaurant.name.toLowerCase().includes(queryLower);
    const inDescription = restaurant.description?.toLowerCase().includes(queryLower);
    const inItems = restaurant.items?.some(item => 
      item.name.toLowerCase().includes(queryLower) ||
      item.description?.toLowerCase().includes(queryLower)
    );
    
    return inName || inDescription || inItems;
  });

  // Sort restaurants
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    switch (sort) {
      case 'near':
        // For now, just sort by name (would need location data for real distance)
        return a.name.localeCompare(b.name);
      case 'cheap':
        const aMinPrice = Math.min(...(a.items?.map(i => i.price) || [Infinity]));
        const bMinPrice = Math.min(...(b.items?.map(i => i.price) || [Infinity]));
        return aMinPrice - bMinPrice;
      case 'pop':
      default:
        // Sort by number of items (proxy for popularity)
        return (b.items?.length || 0) - (a.items?.length || 0);
    }
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        {/* Banner khuyến mãi */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white">
          <div className="text-2xl font-bold">Ưu đãi siêu hot hôm nay</div>
          <div className="opacity-90">Miễn phí ship cho đơn từ 99k • Giảm đến 50%</div>
          <div className="mt-3 text-sm opacity-90">Đặt món ngay để nhận ưu đãi!</div>
        </div>

        {/* Categories */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {["Bún/Phở","Cơm","Trà sữa","Cafe","Fast food","Ăn vặt"].map((category) => (
            <a 
              key={category} 
              href={`/customer?q=${encodeURIComponent(category)}`} 
              className="rounded-xl border bg-white p-3 text-center text-sm font-medium hover:border-orange-500 hover:text-orange-600 transition-colors"
            >
              {category}
            </a>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Khám phá quán ngon</h1>
        <p className="text-gray-600 mt-2">Chọn nhà hàng và đặt món yêu thích</p>
          </div>
          
          {/* Cart Icon */}
          <div className="relative">
            <button 
              onClick={() => window.location.href = '/customer/cart'}
              className="relative p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Sort */}
        <form action="/customer" className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 flex gap-2">
              <input 
                name="q" 
                placeholder="Tìm nhà hàng hoặc món..." 
                className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" 
                defaultValue={query}
              />
              <button className="btn-primary">Tìm</button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Sắp xếp:</span>
              <select name="sort" className="rounded-lg border px-3 py-2" defaultValue={sort}>
                <option value="pop">Được đặt nhiều</option>
                <option value="near">Gần nhất</option>
                <option value="cheap">Rẻ nhất</option>
              </select>
            </div>
          </div>
        </form>

        {/* Search Results */}
        {query && query.trim() && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Kết quả tìm kiếm cho "{query}"
              {searchLoading && <span className="text-sm text-gray-500 ml-2">(Đang tìm...)</span>}
            </h2>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((item) => (
                  <div key={item.id} className="card p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl">{item.type === 'food' ? '🍽️' : '🥤'}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-lg font-bold text-orange-600">
                          {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !searchLoading && (
              <div className="text-center py-8 text-gray-600">
                Không tìm thấy món nào phù hợp với "{query}"
              </div>
            )}
          </div>
        )}

        {/* Recommended Items Section */}
        {!query && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Món nổi bật 
              {recommendedItems.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({recommendedItems.length} món)
                </span>
              )}
            </h2>
            {recommendedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendedItems.map((item) => (
                  <div key={item.id} className="card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {/* Hình ảnh món ăn */}
                    <div className="relative h-48 w-full overflow-hidden">
                      {(item.imageUrl || item.imageId) ? (
                        <img 
                          src={item.imageId ? `${api}/images/${item.imageId}` : item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <span className="text-6xl opacity-50">{item.type === 'food' ? '🍽️' : '🥤'}</span>
                        </div>
                      )}
                      {/* Badge loại món */}
                      <div className="absolute top-2 right-2">
                        <span className="bg-white/90 backdrop-blur-sm text-orange-600 text-xs font-medium px-2 py-1 rounded-full">
                          {item.type === 'food' ? 'Món ăn' : 'Đồ uống'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Thông tin món ăn */}
                    <div className="p-4">
                      {/* Tên món và nhà hàng */}
                      <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">{item.restaurant.name}</p>
                      
                      {/* Mô tả */}
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                      )}
                      
                      {/* Giá */}
                      <div className="mb-3">
                        <p className="text-xl font-bold text-orange-600">
                          {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                        </p>
                      </div>
                      
                      {/* Đánh giá sao */}
                      <div className="flex items-center gap-1 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-yellow-400 text-sm">
                              {i < (item.rating || 4) ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">
                          ({item.reviewCount || Math.floor(Math.random() * 50) + 10})
                        </span>
                      </div>

                      {/* Nút hành động */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => addToCart(item.id)}
                          disabled={cartLoading}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                        >
                          {cartLoading ? (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          Thêm vào giỏ
                        </button>
                        <button 
                          onClick={() => buyNow(item.id)}
                          disabled={cartLoading}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                        >
                          Mua ngay
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !loading && (
              <div className="text-center py-8 text-gray-600">
                <p>Chưa có món nào</p>
                <p className="text-sm mt-2">Hãy thử tìm kiếm hoặc quay lại sau</p>
              </div>
            )}
          </div>
        )}

        {/* Restaurants Grid */}
        {!query && (
          <div className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="h-36 w-full bg-gray-200 rounded-xl mb-4" />
                    <div className="h-6 bg-gray-200 rounded mb-2" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="card card-hover p-6">
                    {/* Restaurant Image */}
                    <div className="h-36 w-full overflow-hidden rounded-xl bg-gray-200 mb-4">
                      {restaurant.imageUrl ? (
                        <img 
                          src={restaurant.imageUrl} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Restaurant Info */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{restaurant.name}</h2>
                    {restaurant.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{restaurant.description}</p>
                    )}
                    {restaurant.address && (
                      <p className="text-xs text-gray-500 mb-3">📍 {restaurant.address}</p>
                    )}

                    {/* Menu Items Preview */}
                    {restaurant.items && restaurant.items.length > 0 ? (
                      <ul className="space-y-2 mb-4">
                        {restaurant.items.slice(0, 3).map((item) => (
                          <li key={item.id} className="flex items-center justify-between">
                            <span className="text-gray-700 text-sm truncate">{item.name}</span>
                            <span className="font-semibold text-orange-600 text-sm">
                              {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                            </span>
                          </li>
                        ))}
                        {restaurant.items.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{restaurant.items.length - 3} món khác...
                          </li>
                        )}
              </ul>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">Chưa có món nào</p>
                    )}

                    {/* View Menu Button */}
                    <a 
                      href={`/customer/restaurant/${restaurant.id}`} 
                      className="inline-block w-full text-center btn-primary"
                    >
                      Xem menu ({restaurant.items?.length || 0} món)
                    </a>
            </div>
          ))}
              </div>
            ) : (
              <div className="col-span-full card p-6 text-center text-gray-600">
                <div className="text-4xl mb-4">🍽️</div>
                <h3 className="text-lg font-semibold mb-2">Chưa có nhà hàng nào</h3>
                <p>Hãy đăng ký nhà hàng để bắt đầu kinh doanh!</p>
            </div>
          )}
        </div>
        )}
      </div>
      <ToastContainer />
    </main>
  );
}