"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasRedirected, setHasRedirected] = useState(false);
  const { login, isAuthenticated, user, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already logged in as admin
  useEffect(() => {
    console.log("🔍 AdminLogin useEffect:", { isAuthenticated, user, role: user?.role, hasRedirected });
    if (isAuthenticated && user?.role === UserRole.ADMIN && !hasRedirected) {
      console.log("🔍 Redirecting to /admin/dashboard");
      setHasRedirected(true);
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, user, router, hasRedirected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Prevent login if already authenticated
    if (isAuthenticated && user?.role === UserRole.ADMIN) {
      console.log("🔍 AdminLogin: Already authenticated, skipping login");
      return;
    }

    try {
      console.log("🔍 AdminLogin: Starting login process...");
      await login({ email, password });
      console.log("🔍 AdminLogin: Login completed successfully");
      // Navigation will be handled by useEffect above
    } catch (err) {
      // Error is handled by AuthContext
      console.error('🔍 AdminLogin: Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Đăng nhập vào trang quản trị EatNow
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p>Email: admin@eatnow.com</p>
            <p>Password: admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
