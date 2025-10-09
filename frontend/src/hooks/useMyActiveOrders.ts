import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';

export function useMyActiveOrders() {
  return useQuery({
    queryKey: ['driverActiveOrders'],
    queryFn: () => ordersService.listMyActiveOrders(),
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });
}





