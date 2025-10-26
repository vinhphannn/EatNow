"use client";

import { Inter } from "next/font/google";
import { useEffect } from "react";
import "./globals.css";
import { ToastProvider, AppLoadingProvider } from "../components";
import { SocketCleanupProvider } from "../components/SocketCleanupProvider";
import { AuthProvider } from "../contexts/AuthContext";
import { APP_CONFIG } from "../config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Phông chữ Inter dùng cho giao diện tiếng Việt
const inter = Inter({ 
	subsets: ["latin", "latin-ext", "vietnamese"] as any,
	display: 'swap',
	variable: '--font-inter'
});

// Layout gốc cho toàn bộ ứng dụng Next.js (App Router) - Client Side
export default function RootLayout({ children }: { children: React.ReactNode }) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60, // 1 minute
				gcTime: 1000 * 60 * 5, // 5 minutes
				retry: 1,
				refetchOnWindowFocus: false,
			},
		},
	});

	// Fix hydration mismatch by removing mdl-js class on client side
	useEffect(() => {
		const htmlElement = document.documentElement;
		if (htmlElement) {
			htmlElement.classList.remove('mdl-js');
		}
	}, []);

	// Suppress browser extension errors
	useEffect(() => {
		const originalError = console.error;
		console.error = (...args) => {
			const message = args.join(' ');
			if (message.includes('runtime.lastError') || 
				message.includes('Receiving end does not exist')) {
				return; // Suppress these errors
			}
			originalError.apply(console, args);
		};

		return () => {
			console.error = originalError;
		};
	}, []);

	return (
		<html lang="vi" className={`${inter.variable} font-sans`} suppressHydrationWarning>
			<head>
				<title>{`${APP_CONFIG.NAME} - ${APP_CONFIG.DESCRIPTION}`}</title>
				<meta name="description" content={APP_CONFIG.DESCRIPTION} />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>
					<AuthProvider>
						<SocketCleanupProvider>
							<AppLoadingProvider>
								<ToastProvider>
									{children}
								</ToastProvider>
							</AppLoadingProvider>
						</SocketCleanupProvider>
					</AuthProvider>
				</QueryClientProvider>
			</body>
		</html>
	);
}
