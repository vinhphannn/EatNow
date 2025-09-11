"use client";
import { useState } from "react";

type Order = {
	id: string;
	code: string;
	pickup: string;
	dropoff: string;
	cod: number;
	status: "waiting" | "picking" | "delivering" | "completed";
};

const mockOrders: Order[] = [
	{ id: "1", code: "OD1001", pickup: "Phở Bò 24", dropoff: "Nguyễn Văn A, Q1", cod: 120000, status: "waiting" },
	{ id: "2", code: "OD1002", pickup: "Trà Sữa X", dropoff: "Lê Thị B, Q3", cod: 0, status: "picking" },
];

export default function DriverCurrentPage() {
	const [orders, setOrders] = useState<Order[]>(mockOrders);

	function setStatus(id: string, status: Order["status"]) {
		setOrders((s) => s.map((o) => (o.id === id ? { ...o, status } : o)));
	}

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Đơn hàng hiện tại</h1>
				<div className="mt-6 card p-6">
					<div className="divide-y">
						{orders.map((o) => (
							<div key={o.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<div className="font-semibold text-gray-800">{o.code} • {o.status}</div>
									<div className="text-sm text-gray-600">Lấy: {o.pickup} → Giao: {o.dropoff}</div>
									{typeof o.cod === 'number' && <div className="text-sm text-gray-600">COD: {new Intl.NumberFormat('vi-VN').format(o.cod)} đ</div>}
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{o.status === "waiting" && (
										<button onClick={() => setStatus(o.id, "picking")} className="btn-primary">Nhận đơn</button>
									)}
									{o.status === "picking" && (
										<button onClick={() => setStatus(o.id, "delivering")} className="rounded-md border px-3 py-1.5 hover:bg-gray-50">Bắt đầu giao</button>
									)}
									{o.status === "delivering" && (
										<button onClick={() => setStatus(o.id, "completed")} className="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-700">Hoàn tất</button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</main>
	);
}
