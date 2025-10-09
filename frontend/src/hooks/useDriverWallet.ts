import { useEffect, useState } from "react";
import { apiClient } from "@/services/api.client";

export interface DriverWallet {
  walletBalance: number;
  ordersCompleted: number;
  recentOrders: Array<{ id: string; status: string; total?: number; deliveryFee?: number }>;
}

export function useDriverWallet() {
  const [wallet, setWallet] = useState<DriverWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<any>("/api/v1/drivers/mine/wallet");
        if (mounted) setWallet(res as DriverWallet);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { wallet, loading };
}


