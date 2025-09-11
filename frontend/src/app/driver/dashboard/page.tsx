export default function DriverDashboardPage() {
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
				<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="card p-5">
						<div className="text-sm text-gray-500">Tổng đơn hôm nay</div>
						<div className="mt-1 text-3xl font-bold">8</div>
					</div>
					<div className="card p-5">
						<div className="text-sm text-gray-500">Đơn đang giao</div>
						<div className="mt-1 text-3xl font-bold">2</div>
					</div>
					<div className="card p-5">
						<div className="text-sm text-gray-500">Thu nhập hôm nay</div>
						<div className="mt-1 text-3xl font-bold">420,000 đ</div>
					</div>
					<div className="card p-5">
						<div className="text-sm text-gray-500">Điểm đánh giá</div>
						<div className="mt-1 text-3xl font-bold">4.9</div>
					</div>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div className="card p-6">
						<div className="font-semibold text-gray-800">Bản đồ hoạt động (placeholder)</div>
						<div className="mt-3 h-64 w-full rounded-xl bg-gray-200" />
					</div>
					<div className="card p-6">
						<div className="font-semibold text-gray-800">Thông báo mới</div>
						<ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
							<li>Đơn #OD1234 đã sẵn sàng để nhận</li>
							<li>Chính sách thưởng tuần mới đã cập nhật</li>
						</ul>
					</div>
				</div>
			</div>
		</main>
	);
}
