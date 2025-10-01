export default function AdminAnalyticsPage() {
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Thống kê</h1>
				<div className="mt-4 flex flex-wrap items-center gap-3">
					<select className="rounded-md border px-3 py-2">
						<option>Hôm nay</option>
						<option>7 ngày</option>
						<option>30 ngày</option>
					</select>
					<select className="rounded-md border px-3 py-2">
						<option>Doanh thu</option>
						<option>Lượng đơn</option>
						<option>Người dùng mới</option>
					</select>
				</div>
				<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div className="card p-6">
						<div className="font-semibold text-gray-800">Biểu đồ tổng quan (placeholder)</div>
						<div className="mt-3 h-64 w-full rounded-xl bg-gray-200" />
					</div>
					<div className="card p-6">
						<div className="font-semibold text-gray-800">Top món bán chạy (placeholder)</div>
						<div className="mt-3 h-64 w-full rounded-xl bg-gray-200" />
					</div>
				</div>
			</div>
		</main>
	);
}
