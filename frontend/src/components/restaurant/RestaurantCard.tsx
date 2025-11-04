import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faTruck, faStore } from "@fortawesome/free-solid-svg-icons";
import { FavoriteButton } from "../favorites/FavoriteButton";

export interface RestaurantCardProps {
  restaurant: {
    _id?: string;
    id?: string;
    name: string;
    imageUrl?: string;
    rating?: number;
    address?: string;
    ward?: string;
    district?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  distance?: string | null;
  showDistance?: boolean;
  className?: string;
}

/**
 * Component card hiển thị thông tin nhà hàng
 * Sử dụng chung cho home page, featured collections, và các trang danh sách nhà hàng khác
 */
export function RestaurantCard({ 
  restaurant, 
  distance, 
  showDistance = true,
  className = "" 
}: RestaurantCardProps) {
  // Lấy địa chỉ nhà hàng
  const getRestaurantAddress = () => {
    if (restaurant?.address) return restaurant.address;
    const parts = [restaurant?.ward, restaurant?.district, restaurant?.city].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
  };

  // Lấy ID nhà hàng (hỗ trợ cả _id và id)
  const restaurantId = restaurant._id || restaurant.id;

  if (!restaurantId) {
    console.warn('RestaurantCard: restaurant missing _id or id', restaurant);
    return null;
  }

  return (
    <Link
      href={`/customer/restaurants/${restaurantId}`}
      className={`group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow ${className}`}
      prefetch={false}
    >
      {/* Image Section */}
      <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        <FavoriteButton restaurantId={restaurantId} />
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Default placeholder với logo EatNow - Design chuyên nghiệp */
          <div className="w-full h-full bg-gradient-to-br from-orange-500 via-orange-400 to-red-500 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }}></div>
            </div>
            
            {/* Main logo container */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Logo "E" với shadow */}
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-500 to-red-500 text-5xl font-extrabold">
                    E
                  </span>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white opacity-20 rounded-2xl blur-xl"></div>
              </div>
              
              {/* Brand name */}
              <div className="mt-4 text-center">
                <p className="text-white text-sm font-bold tracking-wider drop-shadow-lg">EatNow</p>
                <p className="text-white text-xs font-medium opacity-80 mt-1">Nhà hàng</p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-2 right-2 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-2 left-2 w-16 h-16 bg-white bg-opacity-10 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white bg-opacity-5 rounded-full blur-lg"></div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Tên nhà hàng */}
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">
          {restaurant.name}
        </h3>

        {/* Địa chỉ */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {getRestaurantAddress()}
        </p>

        {/* Footer: Rating và khoảng cách */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          {/* Rating */}
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
            <span>{restaurant.rating?.toFixed(1) || '4.5'}</span>
          </span>

          {/* Khoảng cách */}
          {showDistance && (
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon={faTruck} />
              <span>{distance || '—'}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
