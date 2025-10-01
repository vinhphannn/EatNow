"use client";

import { useAdminAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function AdminDebugRawPage() {
  const { user, isAuthenticated, isLoading, error } = useAdminAuth();

  useEffect(() => {
    console.log("🔍 AdminDebugRawPage: Current Auth State");
    console.log("  - isLoading:", isLoading);
    console.log("  - isAuthenticated:", isAuthenticated);
    console.log("  - user:", user);
    console.log("  - error:", error);
  }, [user, isAuthenticated, isLoading, error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Auth Debug (Raw)</h1>
        <p className="text-gray-600">Trang này KHÔNG có AuthGuard, chỉ hiển thị auth state.</p>
        
        <div className="mt-6 text-left space-y-2">
          <p className="text-lg"><strong>Loading:</strong> {isLoading ? 'True' : 'False'}</p>
          <p className="text-lg"><strong>Authenticated:</strong> {isAuthenticated ? 'True' : 'False'}</p>
          <p className="text-lg"><strong>User Role:</strong> {user?.role || 'N/A'}</p>
          <p className="text-lg"><strong>User Email:</strong> {user?.email || 'N/A'}</p>
          <p className="text-lg"><strong>User Name:</strong> {user?.name || 'N/A'}</p>
          <p className="text-lg"><strong>Error:</strong> {error || 'None'}</p>
          <p className="text-lg"><strong>Access Token:</strong> Check localStorage</p>
          <p className="text-lg"><strong>Refresh Token:</strong> Check localStorage</p>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Kiểm tra console log để xem chi tiết hơn.</p>
          <p>Trang này sẽ KHÔNG redirect về login.</p>
        </div>
      </div>
    </div>
  );
}
