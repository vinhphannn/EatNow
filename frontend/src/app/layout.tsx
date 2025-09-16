import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import { SocketCleanupProvider } from "../components/SocketCleanupProvider";

// Phông chữ Inter dùng cho giao diện tiếng Việt
const inter = Inter({ subsets: ["latin", "latin-ext", "vietnamese"] as any });

// Thông tin SEO cơ bản cho ứng dụng
export const metadata: Metadata = {
	title: "EatNow - Đặt đồ ăn nhanh trực tuyến",
	description: "Nền tảng đặt đồ ăn trực tuyến hàng đầu Việt Nam",
};

// Layout gốc cho toàn bộ ứng dụng Next.js (App Router)
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="vi">
			<body className={inter.className}>
				<SocketCleanupProvider>
					{children}
					<Footer />
				</SocketCleanupProvider>
			</body>
		</html>
	);
}
