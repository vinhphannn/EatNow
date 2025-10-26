"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavBar() {
	const pathname = usePathname();
	const isActive = (href: string) => pathname?.startsWith(href) ? "text-orange-600" : "text-gray-700";
	return (
		<header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<nav className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
				<Link href="/admin/dashboard" className="font-extrabold text-xl text-gray-900">🛠️ Admin</Link>
				<div className="flex flex-wrap items-center gap-4 text-sm">
					<Link href="/admin/dashboard" className={isActive("/admin/dashboard")}>Dashboard</Link>
					<Link href="/admin/restaurants" className={isActive("/admin/restaurants")}>Nhà hàng</Link>
					<Link href="/admin/customers" className={isActive("/admin/customers")}>Khách hàng</Link>
					<Link href="/admin/drivers" className={isActive("/admin/drivers")}>Tài xế</Link>
					<Link href="/admin/orders" className={isActive("/admin/orders")}>Đơn hàng</Link>
					<Link href="/admin/categories" className={isActive("/admin/categories")}>Danh mục</Link>
					<Link href="/admin/vouchers" className={isActive("/admin/vouchers")}>Khuyến mãi</Link>
					<Link href="/admin/analytics" className={isActive("/admin/analytics")}>Thống kê</Link>
					<Link href="/admin/settings" className={isActive("/admin/settings")}>Cấu hình</Link>
				</div>
			</nav>
		</header>
	);
}
