'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">EatNow</h3>
            <p className="text-gray-300 text-sm">
              Nền tảng đặt đồ ăn trực tuyến hàng đầu Việt Nam
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Liên kết</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/customer" className="hover:text-white">Khách hàng</a></li>
              <li><a href="/restaurant" className="hover:text-white">Nhà hàng</a></li>
              <li><a href="/driver" className="hover:text-white">Tài xế</a></li>
              <li><a href="/admin" className="hover:text-white">Quản trị</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-white">Liên hệ</a></li>
              <li><a href="#" className="hover:text-white">Điều khoản</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Theo dõi</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">Facebook</a>
              <a href="#" className="text-gray-300 hover:text-white">Instagram</a>
              <a href="#" className="text-gray-300 hover:text-white">Twitter</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-300">
          <p>&copy; 2024 EatNow. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}