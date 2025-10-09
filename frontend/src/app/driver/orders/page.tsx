"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAvailableOrders } from "@/hooks/useAvailableOrders";
import { useMyActiveOrders } from "@/hooks/useMyActiveOrders";
import { useSocketDriver } from "@/hooks/useSocketDriver";
import { ordersService } from "@/services/orders.service";
import { useDriverAuth } from "@/contexts/AuthContext";

export default function DriverOrdersTestPage() {
  const { user } = useDriverAuth();
  const driverId = (user as any)?.id || (user as any)?._id;
  useSocketDriver(driverId);
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: availableData, isLoading: loadingAvailable } = useAvailableOrders();
  const { data: activeData, isLoading: loadingActive } = useMyActiveOrders();

  const available = (Array.isArray(availableData) ? availableData : []) as any[];
  const active = (Array.isArray(activeData) ? activeData : []) as any[];
  const loading = loadingAvailable || loadingActive;

  const acceptOrder = async (orderId: string) => {
    setBusyId(orderId);
    try {
      await ordersService.acceptOrder(orderId);
      queryClient.invalidateQueries({ queryKey: ['availableOrders'] });
      queryClient.invalidateQueries({ queryKey: ['driverActiveOrders'] });
    } catch (e: any) {
      alert(e?.message || 'Không thể nhận đơn');
    } finally {
      setBusyId(null);
    }
  };

  const completeOrder = async (orderId: string) => {
    setBusyId(orderId);
    try {
      await ordersService.completeOrder(orderId);
      queryClient.invalidateQueries({ queryKey: ['driverActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['availableOrders'] });
    } catch (e: any) {
      alert(e?.message || 'Không thể hoàn thành đơn');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Driver Orders (Test)</h1>
          <button onClick={() => { queryClient.invalidateQueries({ queryKey: ['availableOrders'] }); queryClient.invalidateQueries({ queryKey: ['driverActiveOrders'] }); }} className="px-3 py-1 rounded-md bg-orange-500 text-white hover:bg-orange-600">Làm mới</button>
        </div>

        {loading ? (
          <div className="text-gray-600">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Đơn khả dụng</h2>
                <span className="text-sm text-gray-500">{available.length}</span>
              </div>
              <div className="p-4 space-y-3">
                {available.length === 0 && (
                  <div className="text-gray-500 text-sm">Không có đơn sẵn sàng</div>
                )}
                {available.map((o: any) => (
                  <div key={o.id || o._id} className="p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">#{String(o.id || o._id).slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-gray-500">Tổng: ₫{Number(o.total||0).toLocaleString('vi-VN')} • Ship: ₫{Number(o.deliveryFee||0).toLocaleString('vi-VN')}</div>
                    </div>
                    <button
                      onClick={() => acceptOrder(o.id || o._id)}
                      disabled={busyId === (o.id || o._id)}
                      className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                    >
                      {busyId === (o.id || o._id) ? 'Đang nhận...' : 'Nhận đơn'}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Đơn đang giao</h2>
                <span className="text-sm text-gray-500">{active.length}</span>
              </div>
              <div className="p-4 space-y-3">
                {active.length === 0 && (
                  <div className="text-gray-500 text-sm">Chưa có đơn đang giao</div>
                )}
                {active.map((o: any) => (
                  <div key={o.id || o._id} className="p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">#{String(o.id || o._id).slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-gray-500">Trạng thái: {o.status}</div>
                    </div>
                    <button
                      onClick={() => completeOrder(o.id || o._id)}
                      disabled={busyId === (o.id || o._id)}
                      className="px-3 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-60"
                    >
                      {busyId === (o.id || o._id) ? 'Đang hoàn tất...' : 'Hoàn thành'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}


