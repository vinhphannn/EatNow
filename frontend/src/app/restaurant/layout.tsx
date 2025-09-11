"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

export default function RestaurantLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string) => pathname?.startsWith(href) ? "bg-orange-50 text-orange-700" : "hover:bg-gray-50";
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    try {
      const t = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_token') : null;
      const u = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_user') : null;
      const rid = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_restaurant_id') : null;
      setToken(t);
      setUser(u ? JSON.parse(u) : null);
      // fetch restaurant if id available
      (async () => {
        try {
          const id = rid;
          if (id) {
            const r = await fetch(`${api}/restaurants/${id}`, { headers: token ? { Authorization: `Bearer ${t}` } : {} });
            if (r.ok) setRestaurant(await r.json());
          } else if (u) {
            const parsed = JSON.parse(u);
            if (parsed?.id) {
              const r = await fetch(`${api}/restaurants?ownerUserId=${parsed.id}`, { headers: token ? { Authorization: `Bearer ${t}` } : {} });
              if (r.ok) {
                const list = await r.json();
                const first = Array.isArray(list) && list.length ? list[0] : null;
                const resolvedId = first?.id || first?._id || first?._id?.$oid;
                if (resolvedId && typeof localStorage !== 'undefined') localStorage.setItem('eatnow_restaurant_id', resolvedId as string);
                setRestaurant(first);
              }
            }
          }
        } catch {}
      })();
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const displayName = useMemo(() => restaurant?.name || user?.email || "Nhà hàng", [restaurant, user]);
  const avatarText = useMemo(() => (restaurant?.name || user?.name || user?.email || "?").slice(0,1).toUpperCase(), [restaurant, user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-white">
          <div className="px-4 py-4 text-xl font-bold text-gray-900">Nhà hàng</div>
          <nav className="px-2 py-2 space-y-1 text-sm text-gray-700">
            <Link href="/restaurant/dashboard" className={`block rounded-md px-3 py-2 ${isActive("/restaurant/dashboard")}`}>Dashboard</Link>
            <Link href="/restaurant/menu" className={`block rounded-md px-3 py-2 ${isActive("/restaurant/menu")}`}>Món ăn</Link>
            <Link href="/restaurant/orders" className={`block rounded-md px-3 py-2 ${isActive("/restaurant/orders")}`}>Đơn hàng</Link>
            <Link href="/restaurant/customers" className={`block rounded-md px-3 py-2 ${isActive("/restaurant/customers")}`}>Khách hàng</Link>
            <Link href="/restaurant/promotions" className={`block rounded-md px-3 py-2 ${isActive("/restaurant/promotions")}`}>Khuyến mãi</Link>
            <Link href="/restaurant/stats" className={`block rounded-md px-3 py-2 ${isActive("/restaurant/stats")}`}>Thống kê</Link>
          </nav>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex items-center justify-between px-6 py-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{restaurant?.name || 'Chưa thiết lập'}</div>
                <div className="text-xs text-gray-500">Quản trị nhà hàng</div>
              </div>
              <div className="flex items-center gap-3">
                {token && user?.role === 'restaurant' ? (
                  <Link href="/restaurant/profile" className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white text-sm font-semibold">
                      {avatarText}
                    </div>
                    <div className="hidden sm:block text-sm text-gray-800 max-w-[160px] truncate">{displayName}</div>
                  </Link>
                ) : (
                  <>
                    <Link href="/restaurant/login" className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Đăng nhập</Link>
                    <Link href="/restaurant/register" className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">Đăng ký</Link>
                  </>
                )}
              </div>
            </div>
          </header>
          <div className="container mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


