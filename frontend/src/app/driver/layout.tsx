"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DriverNavBar } from "../../components";
import { DriverGuard } from "@/components/guards/AuthGuard";
import { useDriverAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";

export default function DriverLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useDriverAuth();
    
  // Kết nối Socket ngay khi vào driver area
  const { socket, connected } = useSocket(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

    useEffect(() => {
        if (isLoading) return;
        const isAuthPage = pathname === '/driver/login' || pathname === '/driver/register';
        if (isAuthPage) return;
        if (!isAuthenticated) {
            router.push('/driver/login');
            return;
        }
        if (user && user.role !== 'driver') {
            router.push('/unauthorized');
            return;
        }
    }, [isAuthenticated, isLoading, user, pathname, router]);

    // Kết nối Socket và join driver room khi đã authenticated
    useEffect(() => {
        if (isAuthenticated && user && socket && connected) {
            // Join driver room để nhận notifications
            socket.emit('join_driver', user.id);
            console.log('Driver Socket connected and joined driver room');
        }
    }, [isAuthenticated, user, socket, connected]);

    // Loading gate
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Đang kiểm tra đăng nhập...</p>
                </div>
            </div>
        );
    }

    // If on login/register pages, render children without navbar
    if (pathname === '/driver/login' || pathname === '/driver/register') {
        return <>{children}</>;
    }

    // If not authenticated yet, show a neutral loader while redirecting
    if (!isAuthenticated || user?.role !== 'driver') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Đang chuyển hướng đến trang đăng nhập...</p>
                </div>
            </div>
        );
    }

    return (
        <DriverGuard fallbackPath="/driver/login">
            <div className="min-h-screen bg-gray-50">
                <DriverNavBar />
                {children}
            </div>
        </DriverGuard>
    );
}
