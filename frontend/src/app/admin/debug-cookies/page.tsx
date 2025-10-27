"use client";

import { useEffect, useState } from "react";

export default function AdminDebugCookiesPage() {
  const [cookies, setCookies] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get all cookies
    const allCookies: Record<string, string> = {};
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach((cookie) => {
        const [name, value] = cookie.trim().split('=');
        allCookies[name] = value;
      });
    }
    setCookies(allCookies);
  }, []);

  const checkAuth = async () => {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${api}/api/v1/auth/me`, {
        credentials: 'include',
        method: 'GET',
      });
      const data = await response.json();
      console.log('Auth check result:', data);
      alert('Check console for auth result');
    } catch (error) {
      console.error('Auth check error:', error);
      alert('Auth check failed: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">Admin Debug Cookies</h1>
        <p className="text-gray-600">Xem tất cả cookies hiện tại</p>
        
        <div className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold">Cookies:</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
            <pre>{JSON.stringify(cookies, null, 2)}</pre>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={checkAuth}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Check Auth API
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <h3 className="text-lg font-semibold">Admin Auth Cookies:</h3>
          <ul className="space-y-1">
            <li>admin_access_token: {cookies['admin_access_token'] ? '✅ Set' : '❌ Missing'}</li>
            <li>admin_token: {cookies['admin_token'] ? '✅ Set' : '❌ Missing'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

