import type { ReactNode } from "react";
import DriverNavBar from "../../components/nav/DriverNavBar";

export default function DriverLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-gray-50">
			<DriverNavBar />
			{children}
		</div>
	);
}
