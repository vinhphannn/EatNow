import { useEffect, useState } from "react";
import { apiClient } from "@/services/api.client";

export interface RestaurantWallet {
  walletBalance: number;
  totalRevenue: number;
  commissionRate: number;
  recentOrders: Array<{ id: string; status: string; total: number; deliveryFee?: number; netToRestaurant?: number; createdAt?: string }>;
}

export function useRestaurantWallet() {
  const [wallet, setWallet] = useState<RestaurantWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<any>("/api/v1/restaurants/mine/wallet");
        if (mounted) setWallet(res as RestaurantWallet);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { wallet, loading };
}


