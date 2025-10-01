"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function RestaurantLoginContent() {
  const [tab, setTab] = useState<'login' | 'register'>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasRedirected, setHasRedirected] = useState(false);
  const { login, isAuthenticated, user, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Redirect if already logged in as restaurant
  useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.RESTAURANT && !hasRedirected && !isLoading) {
      setHasRedirected(true);
      router.replace('/restaurant/dashboard');
    }
  }, [isAuthenticated, user, hasRedirected, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Prevent login if already authenticated
    if (isAuthenticated && user?.role === UserRole.RESTAURANT) {
      router.replace('/restaurant/dashboard');
      return;
    }

    try {
      await login({ email, password });
      // Redirect immediately after successful login (cookie-based)
      console.log('🔍 Restaurant Login: Redirecting to /restaurant/dashboard');
      window.location.href = '/restaurant/dashboard';
    } catch (err) {
      console.error('Restaurant login error:', err);
    }
  };

  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    clearError();
    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setRegError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      setRegistering(true);
      const res = await fetch(`${api}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, phone, email, password, role: 'restaurant' })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      // On success, redirect to dashboard
      window.location.href = '/restaurant/dashboard';
    } catch (err: any) {
      setRegError(err?.message || 'Đăng ký thất bại');
    } finally {
      setRegistering(false);
    }
  };


  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Background effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-200 opacity-30 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-200 opacity-40 blur-3xl" />

      <div className="relative w-full max-w-3xl">
        {/* Card with tabs */}
        <div className="backdrop-blur-xl bg-white/70 shadow-xl rounded-2xl border border-orange-100">
          <div className="flex">
            {/* Left: visual panel */}
            <div className="hidden md:flex md:w-1/2 p-8 rounded-l-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-4xl font-extrabold">EatNow</div>
                <div className="mt-2 text-white/90">Quản lý nhà hàng hiện đại</div>
                <ul className="mt-6 space-y-3 text-white/90 text-sm">
                  <li>• Theo dõi đơn hàng theo thời gian thực</li>
                  <li>• Quản lý thực đơn nhanh chóng</li>
                  <li>• Phân tích doanh thu và hiệu suất</li>
                </ul>
              </div>
              <div className="absolute -bottom-10 -right-8 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -top-8 -left-6 w-40 h-40 rounded-full bg-white/10 blur-xl" />
            </div>

            {/* Right: form panel */}
            <div className="w-full md:w-1/2 p-6 sm:p-8">
              {/* Tabs */}
              <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                <button
                  onClick={() => { setTab('login'); clearError(); }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab==='login' ? 'bg-orange-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                >Đăng nhập</button>
                <button
                  onClick={() => { setTab('register'); clearError(); }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab==='register' ? 'bg-orange-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                >Đăng ký</button>
              </div>

              {/* Sliding container */}
              <div className="mt-6 relative h-full overflow-hidden">
                <div className={`transition-transform duration-500 ease-in-out flex w-[200%]`} style={{ transform: `translateX(${tab==='login' ? '0%' : '-50%'})` }}>
                  {/* Login form */}
                  <form className="w-1/2 flex-none basis-1/2 pr-4" onSubmit={handleLogin}>
                    <h2 className="text-xl font-bold text-gray-900">Chào mừng quay lại 👋</h2>
                    <p className="text-sm text-gray-500 mt-1">Đăng nhập để quản lý nhà hàng của bạn</p>

                    <div className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm text-gray-600 mb-1">Email</label>
                        <input id="email" type="email" required className="w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-12 px-4 text-base" placeholder="you@restaurant.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
                      </div>
                      <div>
                        <label htmlFor="password" className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
                        <input id="password" type="password" required className="w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-12 px-4 text-base" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
                      </div>
                    </div>

                    {error && (
                      <div className="mt-3 text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-100">
                        {error}
                      </div>
                    )}

                    <button type="submit" disabled={isLoading} className="mt-8 w-full h-12 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <div className="text-center text-xs text-gray-500 mt-3">Demo: restaurant@eatnow.com / restaurant123</div>
                  </form>

                  {/* Register form */}
                  <form className="w-1/2 flex-none basis-1/2 pl-4" onSubmit={handleRegister}>
                    <h2 className="text-xl font-bold text-gray-900">Tạo tài khoản nhà hàng 🧑‍🍳</h2>
                    <p className="text-sm text-gray-500 mt-1">Nhập thông tin để bắt đầu sử dụng EatNow</p>

                    <div className="mt-6 grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tên nhà hàng</label>
                        <input type="text" required className="w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-12 px-4 text-base" placeholder="Ví dụ: Quán Cơm Ngon" value={name} onChange={(e)=>setName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Số điện thoại</label>
                        <input type="tel" required className="w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-12 px-4 text-base" placeholder="0901234567" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input type="email" required className="w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-12 px-4 text-base" placeholder="you@restaurant.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Mật khẩu</label>
                        <input type="password" required className="w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-12 px-4 text-base" placeholder="Tối thiểu 6 ký tự" value={password} onChange={(e)=>setPassword(e.target.value)} />
                      </div>
                    </div>

                    {(regError || error) && (
                      <div className="mt-3 text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-100">
                        {regError || error}
                      </div>
                    )}

                    <button type="submit" disabled={registering} className="mt-8 w-full h-12 rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {registering ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                    <div className="text-xs text-gray-500 mt-3 text-center">Khi đăng ký, bạn đồng ý với Điều khoản & Chính sách của EatNow.</div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantLoginPage() {
  return (
    <ErrorBoundary>
      <RestaurantLoginContent />
    </ErrorBoundary>
  );
}