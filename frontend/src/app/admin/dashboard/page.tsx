"use client";

import { AdminGuard } from "@/components/guards/AuthGuard";
import { useAdminAuth } from "@/contexts/AuthContext";

function AdminDashboardContent() {
	const { user, logout } = useAdminAuth();

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
						<p className="text-gray-600">Xin chào, {user?.name || user?.email}</p>
					</div>
					<button
						onClick={handleLogout}
						className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
					>
						Đăng xuất
					</button>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="bg-white p-6 rounded-lg shadow">
						<div className="text-sm text-gray-500">Đơn hôm nay</div>
						<div className="mt-1 text-3xl font-bold text-gray-900">1,240</div>
					</div>
					<div className="bg-white p-6 rounded-lg shadow">
						<div className="text-sm text-gray-500">Đơn tuần này</div>
						<div className="mt-1 text-3xl font-bold text-gray-900">8,920</div>
					</div>
					<div className="bg-white p-6 rounded-lg shadow">
						<div className="text-sm text-gray-500">Đơn tháng này</div>
						<div className="mt-1 text-3xl font-bold text-gray-900">31,500</div>
					</div>
					<div className="bg-white p-6 rounded-lg shadow">
						<div className="text-sm text-gray-500">Doanh thu tháng</div>
						<div className="mt-1 text-3xl font-bold text-gray-900">12.4 tỷ</div>
					</div>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div className="bg-white p-6 rounded-lg shadow">
						<div className="font-semibold text-gray-800">Biểu đồ doanh thu</div>
						<div className="mt-3 h-64 w-full rounded-xl bg-gray-200 flex items-center justify-center">
							<span className="text-gray-500">Chart placeholder</span>
						</div>
					</div>
					<div className="bg-white p-6 rounded-lg shadow">
						<div className="font-semibold text-gray-800">Lượng đơn theo khu vực</div>
						<div className="mt-3 h-64 w-full rounded-xl bg-gray-200 flex items-center justify-center">
							<span className="text-gray-500">Heatmap placeholder</span>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

export default function AdminDashboardPage() {
	return (
		<AdminGuard>
			<AdminDashboardContent />
		</AdminGuard>
	);
}
