"use client";
import { useEffect, useState } from "react";

type R = { id: string; name: string; status: string; ownerUserId?: string; createdAt?: string };

export default function AdminRestaurantsPage() {
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	const [restaurants, setRestaurants] = useState<R[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			setError(null);
			try {
				const res = await fetch(`${api}/restaurants`);
				if (!res.ok) { setError(`HTTP ${res.status}`); setRestaurants([]); return; }
				const data = await res.json();
				setRestaurants(Array.isArray(data) ? data : []);
			} catch {
				setError('Không thể tải danh sách nhà hàng');
				setRestaurants([]);
			}
		})();
	}, []);

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Quản lý Nhà hàng</h1>
				{error && <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
				<div className="mt-6 overflow-x-auto rounded-xl border bg-white">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-left text-gray-600">
							<tr>
								<th className="px-4 py-3">Tên</th>
								<th className="px-4 py-3">Chủ quán</th>
								<th className="px-4 py-3">Trạng thái</th>
								<th className="px-4 py-3">Ngày tạo</th>
							</tr>
						</thead>
						<tbody>
							{(restaurants||[]).map((r)=> (
								<tr key={r.id} className="border-t">
									<td className="px-4 py-3">{r.name}</td>
									<td className="px-4 py-3">{r.ownerUserId || ''}</td>
									<td className="px-4 py-3">{r.status}</td>
									<td className="px-4 py-3">{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : ''}</td>
								</tr>
							))}
							{restaurants && restaurants.length === 0 && (
								<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>
							)}
							{!restaurants && (
								<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Đang tải...</td></tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</main>
	);
}
