"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../../store/cart";
import { useEffect, useMemo, useRef, useState } from "react";

export default function CustomerNavBar() {
	const router = useRouter();
	const params = useSearchParams();
	const { items } = useCart();
	const cartCount = items.reduce((s, i) => s + i.quantity, 0);
	const [theme, setTheme] = useState<"light"|"dark">("light");
	const [q, setQ] = useState<string>(params.get('q') ?? '');
	const [suggestions, setSuggestions] = useState<Array<{ id:string; name:string; price:number }>>([]);
	const [open, setOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);
	const [user, setUser] = useState<{ id?:string; name?:string; email?:string; role?:string } | null>(null);
	const timer = useRef<any>();
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

	useEffect(() => {
		const stored = typeof window !== 'undefined' ? localStorage.getItem('eatnow_theme') : null;
		const t = (stored === 'dark' || stored === 'light') ? stored : 'light';
		setTheme(t as any);
		if (typeof document !== 'undefined') document.documentElement.dataset.theme = t;

		// Load current user if logged in
		const u = typeof window !== 'undefined' ? localStorage.getItem('eatnow_user') : null;
		if (u) {
			try { setUser(JSON.parse(u)); } catch { setUser(null); }
		}
	}, []);

	function toggleTheme() {
		const next = theme === 'light' ? 'dark' : 'light';
		setTheme(next);
		if (typeof document !== 'undefined') document.documentElement.dataset.theme = next;
		if (typeof localStorage !== 'undefined') localStorage.setItem('eatnow_theme', next);
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		router.push(q ? `/customer?q=${encodeURIComponent(q)}` : '/customer');
		setOpen(false);
	}

	useEffect(() => {
		if (!q) { setSuggestions([]); setOpen(false); return; }
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(async () => {
			try {
				const res = await fetch(`${api}/search/items?q=${encodeURIComponent(q)}&size=6`, { cache: 'no-store' });
				const data = res.ok ? await res.json() : [];
				setSuggestions(data);
				setOpen(true);
			} catch { setSuggestions([]); setOpen(false); }
		}, 350);
		return () => timer.current && clearTimeout(timer.current);
	}, [q]);

	return (
		<header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
				<div className="relative flex items-center gap-4">
					<Link href="/customer" className="font-extrabold text-xl text-gray-900">🍔 EatNow</Link>
					<form onSubmit={onSubmit} className="relative hidden md:block">
						<input
							value={q}
							onChange={(e)=>setQ(e.target.value)}
							placeholder="Tìm món hoặc quán..."
							className="w-[360px] rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
						/>
						{open && suggestions.length > 0 && (
							<div className="absolute left-0 top-full z-40 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow">
								{suggestions.map((s)=> (
									<button key={s.id} type="button" onClick={()=>{ setQ(s.name); router.push(`/customer?q=${encodeURIComponent(s.name)}`); setOpen(false); }} className="flex w-full items-center justify-between px-3 py-2 hover:bg-gray-50">
										<span className="text-sm text-gray-800">{s.name}</span>
										<span className="text-sm font-semibold text-orange-600">{new Intl.NumberFormat('vi-VN').format(s.price)} đ</span>
									</button>
								))}
							</div>
						)}
					</form>
				</div>

				<div className="relative flex items-center gap-3">
					<button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-md border px-3 py-1.5 hover:bg-gray-50">
						{theme === 'dark' ? '🌙' : '☀️'}
					</button>
					<Link href="/customer/cart" className="relative rounded-md border px-3 py-1.5 hover:bg-gray-50">
						<span>🛒 Giỏ hàng</span>
						{cartCount > 0 && (
							<span className="absolute -right-2 -top-2 min-w-[20px] rounded-full bg-orange-600 px-1.5 text-center text-xs font-bold text-white">
								{cartCount}
							</span>
						)}
					</Link>
					{user ? (
						<>
							<button onClick={()=> setNotifOpen(v=>!v)} className="relative rounded-md border px-3 py-1.5 hover:bg-gray-50" aria-label="Notifications">
								🔔
								<span className="sr-only">Thông báo</span>
							</button>
							{notifOpen && (
								<div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-lg border bg-white p-3 text-sm shadow">
									<div className="text-gray-700">Chưa có thông báo</div>
								</div>
							)}

							<button onClick={()=> setMenuOpen(v=>!v)} className="flex items-center gap-2 rounded-md border pl-2 pr-3 py-1.5 hover:bg-gray-50">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white">
									{(user.name || user.email || 'U').toString().trim().charAt(0).toUpperCase()}
								</div>
								<span className="hidden sm:block text-sm text-gray-800 max-w-[140px] truncate">{user.name || user.email}</span>
							</button>
							{menuOpen && (
								<div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-lg border bg-white text-sm shadow">
									<a className="block px-4 py-2 hover:bg-gray-50" href="/customer/profile">Quản lý hồ sơ</a>
									<a className="block px-4 py-2 hover:bg-gray-50" href="/customer/orders">Đơn hàng của tôi</a>
									<button className="block w-full px-4 py-2 text-left hover:bg-gray-50" onClick={()=>{ if (typeof localStorage !== 'undefined') { localStorage.removeItem('eatnow_token'); localStorage.removeItem('eatnow_user'); } router.push('/customer/login'); }}>Đăng xuất</button>
								</div>
							)}
						</>
					) : (
						<div className="hidden items-center gap-2 sm:flex">
							<a href="/customer/login" className="rounded-md border px-3 py-1.5 hover:bg-gray-50">Đăng nhập</a>
							<a href="/customer/register" className="rounded-md bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700">Đăng ký</a>
						</div>
					)}
				</div>
			</nav>
		</header>
	);
}
