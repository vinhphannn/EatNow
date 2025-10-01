"use client";

import type { ReactNode } from "react";
import { AdminNavBar } from "../../components";

export default function AdminLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-gray-50">
			<AdminNavBar />
			{children}
		</div>
	);
}
