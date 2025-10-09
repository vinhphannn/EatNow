"use client";

import type { ReactNode } from "react";
import { CustomerNavBar } from "../../components";
import { useCustomerAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CustomerLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, user } = useCustomerAuth();
    const pathname = usePathname();
    const router = useRouter();

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

    return (
        <div className="min-h-screen bg-gray-50">
            <CustomerNavBar />
            {children}
        </div>
    );
}
