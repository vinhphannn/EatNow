"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Footer, ToastProvider, AppLoadingProvider } from "../components";
import { SocketCleanupProvider } from "../components/SocketCleanupProvider";
import { APP_CONFIG } from "../config";

// Phông chữ Inter dùng cho giao diện tiếng Việt
const inter = Inter({ subsets: ["latin", "latin-ext", "vietnamese"] as any });

// Layout gốc cho toàn bộ ứng dụng Next.js (App Router) - Client Side
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="vi" className={inter.className}>
			<head>
				<title>{`${APP_CONFIG.NAME} - ${APP_CONFIG.DESCRIPTION}`}</title>
				<meta name="description" content={APP_CONFIG.DESCRIPTION} />
			</head>
			<body>
				<SocketCleanupProvider>
					<AppLoadingProvider>
						<ToastProvider>
							{children}
							<Footer />
						</ToastProvider>
					</AppLoadingProvider>
				</SocketCleanupProvider>
			</body>
		</html>
	);
}
