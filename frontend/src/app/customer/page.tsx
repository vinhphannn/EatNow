"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/contexts/AuthContext";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/customer/login');
      return;
    }

    // Redirect to home page if authenticated
    router.push('/customer/home');
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}