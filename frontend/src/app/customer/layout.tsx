"use client";

import type { ReactNode } from "react";
import { CustomerNavBar } from "../../components";

export default function CustomerLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-gray-50">
			<CustomerNavBar />
			{children}
		</div>
	);
}
