"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DriverNavBar() {
	const pathname = usePathname();
	const isActive = (href: string) => pathname?.startsWith(href) ? "text-orange-600" : "text-gray-700";
	return (
		<header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<nav className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
				<Link href="/driver/dashboard" className="font-extrabold text-xl text-gray-900">🚗 EatNow Driver</Link>
				<div className="flex flex-wrap items-center gap-4 text-sm">
					<Link href="/driver/dashboard" className={isActive("/driver/dashboard")}>Dashboard</Link>
					<Link href="/driver/current" className={isActive("/driver/current")}>Đơn hiện tại</Link>
					<Link href="/driver/history" className={isActive("/driver/history")}>Lịch sử</Link>
					<Link href="/driver/earnings" className={isActive("/driver/earnings")}>Thu nhập</Link>
					<Link href="/driver/profile" className={isActive("/driver/profile")}>Hồ sơ</Link>
				</div>
			</nav>
		</header>
	);
}
