"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { DriverNavBar } from "../../components";
import { DriverGuard } from "@/components/guards/AuthGuard";
import { useDriverAuth } from "@/contexts/AuthContext";

export default function DriverLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useDriverAuth();

    useEffect(() => {
        if (isLoading) return;
        // Allow login and register without redirect
        const isAuthPage = pathname === '/driver/login' || pathname === '/driver/register';
        if (!isAuthPage && (!isAuthenticated || user?.role !== 'driver')) {
            router.push('/driver/login');
        }
    }, [isAuthenticated, isLoading, user, pathname, router]);

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
