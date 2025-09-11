export default function AdminDashboardPage() {
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
				<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="card p-5"><div className="text-sm text-gray-500">Đơn hôm nay</div><div className="mt-1 text-3xl font-bold">1,240</div></div>
					<div className="card p-5"><div className="text-sm text-gray-500">Đơn tuần này</div><div className="mt-1 text-3xl font-bold">8,920</div></div>
					<div className="card p-5"><div className="text-sm text-gray-500">Đơn tháng này</div><div className="mt-1 text-3xl font-bold">31,500</div></div>
					<div className="card p-5"><div className="text-sm text-gray-500">Doanh thu tháng</div><div className="mt-1 text-3xl font-bold">12.4 tỷ</div></div>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div className="card p-6">
						<div className="font-semibold text-gray-800">Biểu đồ doanh thu (placeholder)</div>
						<div className="mt-3 h-64 w-full rounded-xl bg-gray-200" />
					</div>
					<div className="card p-6">
						<div className="font-semibold text-gray-800">Lượng đơn theo khu vực (heatmap placeholder)</div>
						<div className="mt-3 h-64 w-full rounded-xl bg-gray-200" />
					</div>
				</div>
			</div>
		</main>
	);
}
