"use client";
import { useEffect, useState } from "react";

type D = { id: string; name: string; phone?: string; status?: string; userId?: string; createdAt?: string };

export default function AdminDriversPage() {
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	const [drivers, setDrivers] = useState<D[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			setError(null);
			try {
				const res = await fetch(`${api}/drivers`);
				if (!res.ok) { setError(`HTTP ${res.status}`); setDrivers([]); return; }
				const data = await res.json();
				setDrivers(Array.isArray(data) ? data : []);
			} catch {
				setError('Không thể tải danh sách tài xế');
				setDrivers([]);
			}
		})();
	}, []);

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Quản lý Tài xế</h1>
				{error && <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
				<div className="mt-6 overflow-x-auto rounded-xl border bg-white">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-left text-gray-600">
							<tr>
								<th className="px-4 py-3">Tên</th>
								<th className="px-4 py-3">Số điện thoại</th>
								<th className="px-4 py-3">Trạng thái</th>
								<th className="px-4 py-3">Ngày tạo</th>
							</tr>
						</thead>
						<tbody>
							{(drivers||[]).map((d)=> (
								<tr key={d.id} className="border-t">
									<td className="px-4 py-3">{d.name}</td>
									<td className="px-4 py-3">{d.phone || ''}</td>
									<td className="px-4 py-3">{d.status || ''}</td>
									<td className="px-4 py-3">{d.createdAt ? new Date(d.createdAt).toLocaleString('vi-VN') : ''}</td>
								</tr>
							))}
							{drivers && drivers.length === 0 && (
								<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>
							)}
							{!drivers && (
								<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Đang tải...</td></tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</main>
	);
}
