"use client";
import { useMemo, useState } from "react";

type Row = { id: string; code: string; date: string; customer: string; total: number; status: string };
const mock: Row[] = [
	{ id: "1", code: "OD1001", date: "2025-09-10", customer: "Nguyễn Văn A", total: 120000, status: "completed" },
	{ id: "2", code: "OD1002", date: "2025-09-09", customer: "Lê Thị B", total: 65000, status: "completed" },
	{ id: "3", code: "OD1003", date: "2025-09-08", customer: "Trần C", total: 0, status: "canceled" },
];

export default function DriverHistoryPage() {
	const [from, setFrom] = useState<string>("");
	const [to, setTo] = useState<string>("");
	const data = useMemo(() => {
		return mock.filter((r) => {
			if (from && r.date < from) return false;
			if (to && r.date > to) return false;
			return true;
		});
	}, [from, to]);

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Lịch sử đơn</h1>
				<div className="mt-4 flex flex-wrap items-end gap-3">
					<div>
						<label className="block text-sm text-gray-600">Từ ngày</label>
						<input value={from} onChange={(e)=>setFrom(e.target.value)} type="date" className="rounded-md border px-3 py-2" />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Đến ngày</label>
						<input value={to} onChange={(e)=>setTo(e.target.value)} type="date" className="rounded-md border px-3 py-2" />
					</div>
				</div>

				<div className="mt-6 overflow-x-auto rounded-xl border bg-white">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-left text-gray-600">
							<tr>
								<th className="px-4 py-3">Mã đơn</th>
								<th className="px-4 py-3">Ngày</th>
								<th className="px-4 py-3">Khách hàng</th>
								<th className="px-4 py-3">Số tiền</th>
								<th className="px-4 py-3">Trạng thái</th>
							</tr>
						</thead>
						<tbody>
							{data.map((r) => (
								<tr key={r.id} className="border-t">
									<td className="px-4 py-3 font-medium">{r.code}</td>
									<td className="px-4 py-3">{r.date}</td>
									<td className="px-4 py-3">{r.customer}</td>
									<td className="px-4 py-3">{new Intl.NumberFormat('vi-VN').format(r.total)} đ</td>
									<td className="px-4 py-3">{r.status}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</main>
	);
}
