export default function DriverEarningsPage() {
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Thu nhập</h1>
				<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="card p-5">
						<div className="text-sm text-gray-500">Hôm nay</div>
						<div className="mt-1 text-2xl font-bold">420,000 đ</div>
					</div>
					<div className="card p-5">
						<div className="text-sm text-gray-500">Tuần này</div>
						<div className="mt-1 text-2xl font-bold">2,800,000 đ</div>
					</div>
					<div className="card p-5">
						<div className="text-sm text-gray-500">Tháng này</div>
						<div className="mt-1 text-2xl font-bold">12,400,000 đ</div>
					</div>
					<div className="card p-5">
						<div className="text-sm text-gray-500">Số dư có thể rút</div>
						<div className="mt-1 text-2xl font-bold">1,200,000 đ</div>
					</div>
				</div>

				<div className="mt-6 card p-6">
					<div className="font-semibold text-gray-800">Biểu đồ thu nhập (placeholder)</div>
					<div className="mt-3 h-64 w-full rounded-xl bg-gray-200" />
					<div className="mt-4">
						<button className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">Rút tiền (demo)</button>
					</div>
				</div>
			</div>
		</main>
	);
}
