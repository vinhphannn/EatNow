import { useQuery } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';

export function useAvailableOrders() {
  return useQuery({
    queryKey: ['availableOrders'],
    queryFn: () => ordersService.listAvailableOrders(),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}





