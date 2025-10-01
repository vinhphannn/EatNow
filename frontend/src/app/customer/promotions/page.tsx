'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function PromotionsPage() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock promotions data for now
    const mockPromotions = [
      {
        id: 1,
        title: "Giảm 50% cho đơn hàng đầu tiên",
        description: "Áp dụng cho tất cả món ăn, tối đa 100.000đ",
        discount: 50,
        type: "percentage",
        minOrder: 0,
        maxDiscount: 100000,
        validUntil: "2024-12-31",
        image: "🎉"
      },
      {
        id: 2,
        title: "Miễn phí ship cho đơn từ 200k",
        description: "Áp dụng cho tất cả nhà hàng trong khu vực",
        discount: 0,
        type: "free_shipping",
        minOrder: 200000,
        validUntil: "2024-12-31",
        image: "🚚"
      },
      {
        id: 3,
        title: "Combo 2 món chỉ 150k",
        description: "Chọn 2 món bất kỳ từ menu, tiết kiệm 50k",
        discount: 0,
        type: "combo",
        originalPrice: 200000,
        salePrice: 150000,
        validUntil: "2024-12-31",
        image: "🍽️"
      }
    ];
    
    setPromotions(mockPromotions);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/customer/home" className="mr-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Khuyến mãi</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ưu đãi hấp dẫn</h2>
          <p className="text-gray-600">Khám phá các chương trình khuyến mãi đặc biệt dành cho bạn</p>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <div key={promo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Promo Image */}
              <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <span className="text-6xl">{promo.image}</span>
              </div>

              {/* Promo Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{promo.title}</h3>
                <p className="text-gray-600 mb-4">{promo.description}</p>

                {/* Promo Details */}
                <div className="space-y-2 mb-4">
                  {promo.type === 'percentage' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Giảm giá:</span>
                      <span className="text-lg font-bold text-orange-600">{promo.discount}%</span>
                    </div>
                  )}
                  
                  {promo.type === 'free_shipping' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Điều kiện:</span>
                      <span className="text-sm font-medium text-green-600">Miễn phí ship</span>
                    </div>
                  )}
                  
                  {promo.type === 'combo' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Giá gốc:</span>
                      <span className="text-sm text-gray-400 line-through">{promo.originalPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}

                  {promo.minOrder > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Đơn tối thiểu:</span>
                      <span className="text-sm font-medium">{promo.minOrder.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Hết hạn:</span>
                    <span className="text-sm font-medium text-red-600">{promo.validUntil}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Link 
                  href="/customer/home"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-center transition-colors block"
                >
                  Sử dụng ngay
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {promotions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Chưa có khuyến mãi</h3>
            <p className="text-gray-600 mb-6">Hiện tại chưa có chương trình khuyến mãi nào. Hãy quay lại sau nhé!</p>
            <Link 
              href="/customer/home"
              className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

