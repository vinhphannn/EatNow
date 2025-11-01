"use client";

import Link from "next/link";
import FooterCustomer from "@/components/FooterCustomer";
import { Shield, User, Utensils, Bike, Rocket, CreditCard, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const actors = [
    {
      title: "Admin",
      description: "Quản lý hệ thống, nhà hàng, tài xế và đơn hàng",
      icon: Shield,
      href: "/admin",
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Khách hàng",
      description: "Đặt món ăn, theo dõi đơn hàng và quản lý hồ sơ",
      icon: User,
      href: "/customer",
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Nhà hàng",
      description: "Quản lý thực đơn, đơn hàng và thống kê doanh thu",
      icon: Utensils,
      href: "/restaurant",
      color: "from-green-500 to-teal-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Tài xế",
      description: "Nhận đơn hàng, cập nhật trạng thái và quản lý thu nhập",
      icon: Bike,
      href: "/driver",
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header removed per request */}

      {/* Hero Section */}
      <section className="pt-16 pb-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Chào mừng đến với
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"> EatNow</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Nền tảng đặt món ăn trực tuyến hàng đầu Việt Nam. 
            Kết nối khách hàng với hàng ngàn nhà hàng uy tín.
          </p>
        </div>
      </section>

      {/* Actor Selection */}
      <section className="pt-8 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Chọn vai trò của bạn
            </h3>
            <p className="text-gray-600">
              Đăng nhập vào hệ thống với vai trò phù hợp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {actors.map((actor, index) => (
              <Link
                key={index}
                href={actor.href}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${actor.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative p-8 text-center">
                  {/* Icon */}
                  <div className={`w-20 h-20 ${actor.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <actor.icon size={36} strokeWidth={1.75} className={actor.textColor} />
                  </div>
                  
                  {/* Title */}
                  <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-700">
                    {actor.title}
                  </h4>
                  
                  {/* Description */}
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {actor.description}
                  </p>
                  
                  {/* Button */}
                  <div className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${actor.color} text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform group-hover:scale-105`}>
                    <span className="mr-2">Truy cập</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-200 rounded-2xl transition-colors duration-300"></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn EatNow?
            </h3>
            <p className="text-gray-600">
              Nền tảng đặt món ăn với nhiều tính năng vượt trội
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-7 h-7 text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Giao hàng nhanh
              </h4>
              <p className="text-gray-600">
                Giao món ăn tận nơi trong 15-30 phút với đội ngũ tài xế chuyên nghiệp
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-7 h-7 text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Món ăn đa dạng
              </h4>
              <p className="text-gray-600">
                Hàng ngàn món ăn từ các nhà hàng uy tín, đảm bảo chất lượng và hương vị
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-orange-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Thanh toán tiện lợi
              </h4>
              <p className="text-gray-600">
                Hỗ trợ nhiều hình thức thanh toán: COD, thẻ, ví điện tử
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-orange-100">Nhà hàng</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-orange-100">Khách hàng</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-orange-100">Đơn hàng</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8★</div>
              <div className="text-orange-100">Đánh giá</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <FooterCustomer />
    </div>
  );
}










// NEXT_PUBLIC_API_URL=http://localhost:3001
// NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dfqfabmkx
// NEXT_PUBLIC_WS_URL=http://localhost:3001
// NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=preset