"use client";
import { useEffect, useMemo, useState } from "react";
import { driverService } from "@/services/driver.service";

type UiOrder = {
    id: string;
    code: string;
    pickup: string;
    dropoff: string;
    cod: number;
    status: string;
};

export default function DriverCurrentPage() {
    const [orders, setOrders] = useState<UiOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    async function load() {
        try {
            setLoading(true);
            const res: any = await driverService.getMyOrders({ status: undefined, page: 1, limit: 20 });
            const list: any[] = Array.isArray(res) ? res : res?.orders || [];
            setOrders(list.map((o: any) => ({
                id: o._id || o.id,
                code: o.orderNumber || o.code || o.id,
                pickup: o.restaurantName || o.restaurant?.name || "",
                dropoff: o.customerName || o.user?.name || "",
                cod: typeof o.cod === 'number' ? o.cod : (o.paymentMethod === 'COD' ? (o.finalTotal || 0) : 0),
                status: o.status || "pending",
            })));
        } catch (e: any) {
            setError(e?.message || "Không tải được danh sách đơn");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function accept(id: string) {
        await driverService.acceptOrder(id);
        await load();
    }
    async function startPickup(id: string) {
        await driverService.arrivedAtRestaurant(id);
        await driverService.pickedUp(id);
        await load();
    }
    async function complete(id: string) {
        await driverService.arrivedAtCustomer(id);
        await driverService.delivered(id);
        await load();
    }

    const empty = useMemo(() => !loading && orders.length === 0, [loading, orders.length]);

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900">Đơn hàng hiện tại</h1>

                {error && <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                {loading && <div className="mt-6 text-gray-600">Đang tải...</div>}
                {empty && <div className="mt-6 text-gray-600">Chưa có đơn nào</div>}

                {!loading && orders.length > 0 && (
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
                                        {o.status === "pending" && (
                                            <button onClick={() => accept(o.id)} className="btn-primary">Nhận đơn</button>
                                        )}
                                        {o.status === "confirmed" && (
                                            <button onClick={() => startPickup(o.id)} className="rounded-md border px-3 py-1.5 hover:bg-gray-50">Bắt đầu lấy</button>
                                        )}
                                        {(o.status === "ready" || o.status === "preparing") && (
                                            <button onClick={() => startPickup(o.id)} className="rounded-md border px-3 py-1.5 hover:bg-gray-50">Bắt đầu giao</button>
                                        )}
                                        {o.status === "delivering" && (
                                            <button onClick={() => complete(o.id)} className="rounded-md bg-green-600 px-3 py-1.5 text-white hover:bg-green-700">Hoàn tất</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
