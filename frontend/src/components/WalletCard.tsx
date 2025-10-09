"use client";
import React from "react";

type Wallet = {
  walletBalance?: number;
  totalRevenue?: number;
  commissionRate?: number;
  ordersCompleted?: number;
  recentOrders?: Array<{ id: string; status: string; total?: number; deliveryFee?: number; netToRestaurant?: number }>;
};

export default function WalletCard({ title, wallet }: { title: string; wallet: Wallet | null }) {
  if (!wallet) return null;
  return (
    <div className="p-4 rounded-2xl shadow bg-white border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-2 text-sm space-y-1 text-gray-800">
        {wallet.walletBalance !== undefined && (
          <p>Số dư: {Number(wallet.walletBalance || 0).toLocaleString('vi-VN')}₫</p>
        )}
        {wallet.totalRevenue !== undefined && (
          <p>Tổng doanh thu: {Number(wallet.totalRevenue || 0).toLocaleString('vi-VN')}₫</p>
        )}
        {wallet.commissionRate !== undefined && (
          <p>Chiết khấu: {Math.round(Number(wallet.commissionRate) * 100)}%</p>
        )}
        {wallet.ordersCompleted !== undefined && (
          <p>Đơn hoàn thành: {Number(wallet.ordersCompleted || 0)}</p>
        )}
      </div>

      <div className="mt-3 border-t pt-2">
        <p className="text-sm font-medium text-gray-900">Đơn gần đây:</p>
        {wallet.recentOrders && wallet.recentOrders.length > 0 ? (
          <div className="mt-1 space-y-1">
            {wallet.recentOrders.map((o) => (
              <p key={o.id} className="text-xs text-gray-600">
                #{o.id.slice(-6).toUpperCase()} – {o.status} – {(o.total ?? o.deliveryFee ?? 0).toLocaleString('vi-VN')}₫
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">Chưa có đơn gần đây</p>
        )}
      </div>
    </div>
  );
}


