'use client';

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
	const [searchQuery, setSearchQuery] = useState(params.get('q') || '');

	useEffect(() => {
		setSearchQuery(params.get('q') || '');
	}, [params]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/customer?q=${encodeURIComponent(searchQuery)}`);
		} else {
			router.push('/customer');
		}
	};

	const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<header className="sticky top-0 z-50 bg-white border-b shadow-sm">
			<div className="container mx-auto px-4 py-3">
				<div className="flex items-center justify-between">
					{/* Logo */}
					<Link href="/customer" className="text-2xl font-bold text-orange-600">
						EatNow
					</Link>

					{/* Search Bar */}
					<form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
						<div className="relative">
							<input
								type="text"
								placeholder="Tìm nhà hàng hoặc món ăn..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
							/>
							<button
								type="submit"
								className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</button>
						</div>
					</form>

					{/* Navigation Links */}
					<nav className="flex items-center space-x-6">
						<Link
							href="/customer"
							className={`text-sm font-medium ${
								pathname === '/customer' ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
							}`}
						>
							Trang chủ
						</Link>
						<Link
							href="/customer/orders"
							className={`text-sm font-medium ${
								pathname?.startsWith('/customer/orders') ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
							}`}
						>
							Đơn hàng
						</Link>
						<Link
							href="/customer/profile"
							className={`text-sm font-medium ${
								pathname?.startsWith('/customer/profile') ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
							}`}
						>
							Hồ sơ
						</Link>

						{/* Cart */}
						<Link
							href="/customer/cart"
							className="relative p-2 text-gray-700 hover:text-orange-600"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
							</svg>
							{totalItems > 0 && (
								<span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
									{totalItems}
								</span>
							)}
						</Link>
					</nav>
				</div>
			</div>
		</header>
	);
}