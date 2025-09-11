"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../store/cart";
import { useEffect, useState } from "react";

// Thanh điều hướng cho khách hàng
export default function NavBar() {
	const pathname = usePathname();
	const router = useRouter();
	const params = useSearchParams();
	const { items } = useCart();
	const isAdmin = pathname?.startsWith('/admin');
	const cartCount = items.reduce((s, i) => s + i.quantity, 0);
	const [bump, setBump] = useState(false);

	useEffect(() => {
		if (cartCount <= 0) return;
		setBump(true);
		const t = setTimeout(() => setBump(false), 300);
		return () => clearTimeout(t);
	}, [cartCount]);

	const onSearch = (formData: FormData) => {
		const q = String(formData.get('q') || '').trim();
		if (isAdmin) return;
		router.push(q ? `/customer?q=${encodeURIComponent(q)}` : "/customer");
	};

	return (
		<header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<nav className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
				<div className="flex items-center gap-4">
					<Link href="/" className="font-extrabold text-xl text-gray-900">🍔 EatNow</Link>
					{!isAdmin && (
						<form action={onSearch} className="hidden md:block">
							<input
								name="q"
								defaultValue={params.get('q') ?? ''}
								placeholder="Tìm món hoặc quán..."
								className="w-[360px] rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
							/>
						</form>
					)}
				</div>

				{isAdmin ? (
					<div className="flex items-center gap-4 text-sm">
						<a href="/restaurant" target="_blank" className={`hover:text-orange-600`}>Nhà hàng</a>
						<a href="/customer" target="_blank" className={`hover:text-orange-600`}>Người dùng</a>
						<a href="/driver" target="_blank" className={`hover:text-orange-600`}>Tài xế</a>
					</div>
				) : (
					<div className="flex items-center gap-3">
						<Link href="/customer/cart" className="relative rounded-md border px-3 py-1.5 hover:bg-gray-50">
							<span className={bump ? "inline-block animate-pulse" : undefined}>🛒 Giỏ hàng</span>
							{cartCount > 0 && (
								<span className={`absolute -right-2 -top-2 min-w-[20px] rounded-full bg-orange-600 px-1.5 text-center text-xs font-bold text-white ${bump ? 'scale-110 transition-transform' : ''}`}>
									{cartCount}
								</span>
							)}
						</Link>
						{/* Auth placeholder */}
						<Link href="/customer/register" className="btn-outline hidden sm:inline-block">Đăng nhập / Đăng ký</Link>
					</div>
				)}
			</nav>
		</header>
	);
}


