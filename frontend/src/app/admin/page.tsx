"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

export default function AdminIndex() {
	const { isAuthenticated, user, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoading) return;

		if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
			router.push('/admin/login');
			return;
		}

		router.push('/admin/dashboard');
	}, [isAuthenticated, user, isLoading, router]);

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
				<p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
			</div>
		</div>
	);
}



