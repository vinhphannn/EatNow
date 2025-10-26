"use client";

import type { ReactNode } from "react";
import { CustomerNavBar } from "../../components";
import { useCustomerAuth } from "@/contexts/AuthContext";
import { DeliveryAddressProvider } from "@/contexts/DeliveryAddressContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNavBar from "@/components/BottomNavBar";
import { useSocket } from "@/hooks/useSocket";

export default function CustomerLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, user } = useCustomerAuth();
    const pathname = usePathname();
    const router = useRouter();
    
    // Kết nối Socket ngay khi vào customer area
    const { socket, connected } = useSocket(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

    useEffect(() => {
        if (isLoading) return;
        if (pathname === '/customer/login' || pathname === '/customer/register') return;
        if (!isAuthenticated) {
            router.push('/customer/login');
            return;
        }
        if (user && user.role !== 'customer') {
            router.push('/unauthorized');
            return;
        }
    }, [isAuthenticated, isLoading, user, pathname, router]);

    // Kết nối Socket và join user room khi đã authenticated
    useEffect(() => {
        if (isAuthenticated && user && socket && connected) {
            // Join user room để nhận notifications
            socket.emit('join_user', user.id);
            console.log('Customer Socket connected and joined user room');
        }
    }, [isAuthenticated, user, socket, connected]);

    return (
        <DeliveryAddressProvider>
        <div className="min-h-screen bg-gray-50">
            {pathname !== '/customer/profile' && pathname !== '/customer/orders' && pathname !== '/customer/search' && !pathname.startsWith('/customer/checkout') && <CustomerNavBar />}
            {children}
            {!pathname.startsWith('/customer/restaurants/') && <BottomNavBar />}
        </div>
        </DeliveryAddressProvider>
    );
}
