"use client";

import { useRestaurantAuth } from "@/contexts/AuthContext";

export default function RestaurantTestPage() {
  const { isAuthenticated, user, isLoading } = useRestaurantAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Restaurant Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {isLoading ? 'true' : 'false'}
        </div>
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? 'true' : 'false'}
        </div>
        <div>
          <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}
        </div>
        <div>
          <strong>LocalStorage Token:</strong> {typeof window !== 'undefined' ? localStorage.getItem('eatnow_token') || 'null' : 'SSR'}
        </div>
        <div>
          <strong>LocalStorage User:</strong> {typeof window !== 'undefined' ? localStorage.getItem('eatnow_user_data') || 'null' : 'SSR'}
        </div>
      </div>
    </div>
  );
}

