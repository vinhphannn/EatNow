"use client";
import { useMemo, useState } from "react";

type Row = { id: string; code: string; restaurant: string; driver: string; user: string; total: number; status: string };
const mock: Row[] = [
	{ id: "1", code: "OD1001", restaurant: "Quán 1", driver: "TX 1", user: "User 1", total: 120000, status: "delivering" },
	{ id: "2", code: "OD1002", restaurant: "Quán 2", driver: "TX 2", user: "User 2", total: 65000, status: "completed" },
	{ id: "3", code: "OD1003", restaurant: "Quán 1", driver: "TX 3", user: "User 3", total: 90000, status: "canceled" },
];

export default function AdminOrdersPage() {
	const [status, setStatus] = useState<string>("");
	const data = useMemo(() => mock.filter((r)=> (status ? r.status === status : true)), [status]);
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
				<div className="mt-4 flex items-center gap-3">
					<label className="text-sm text-gray-600">Trạng thái</label>
					<select value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-md border px-3 py-2">
						<option value="">Tất cả</option>
						<option value="delivering">Đang giao</option>
						<option value="completed">Hoàn thành</option>
						<option value="canceled">Hủy</option>
					</select>
				</div>
				<div className="mt-6 overflow-x-auto rounded-xl border bg-white">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-left text-gray-600">
							<tr>
								<th className="px-4 py-3">Mã</th>
								<th className="px-4 py-3">Nhà hàng</th>
								<th className="px-4 py-3">Tài xế</th>
								<th className="px-4 py-3">Khách</th>
								<th className="px-4 py-3">Tổng</th>
								<th className="px-4 py-3">Trạng thái</th>
								<th className="px-4 py-3">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{data.map((r)=> (
								<tr key={r.id} className="border-t">
									<td className="px-4 py-3 font-medium">{r.code}</td>
									<td className="px-4 py-3">{r.restaurant}</td>
									<td className="px-4 py-3">{r.driver}</td>
									<td className="px-4 py-3">{r.user}</td>
									<td className="px-4 py-3">{new Intl.NumberFormat('vi-VN').format(r.total)} đ</td>
									<td className="px-4 py-3">{r.status}</td>
									<td className="px-4 py-3">
										<button className="rounded-md border px-3 py-1.5 hover:bg-gray-50">Xem</button>
										<button className="ml-2 rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700">Hủy</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</main>
	);
}
