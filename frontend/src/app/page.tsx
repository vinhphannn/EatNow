"use client";

import { useEffect } from "react";

// Trang chủ: điều hướng nhanh tới 4 khu vực chính (Admin, Nhà hàng, Khách hàng, Tài xế)
export default function Home() {
  useEffect(() => {
    // Client-side redirect
    window.location.href = "/admin";
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">EatNow</h1>
          <p className="text-lg text-gray-700 mb-8">Đang chuyển đến trang quản trị...</p>
          <a className="underline" href="/admin">Nhấn vào đây nếu bạn không được chuyển hướng</a>
        </div>
      </div>
    </main>
  );
}