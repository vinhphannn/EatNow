"use client";

import { AdminGuard } from "@/components/guards/AuthGuard";
import { useAdminAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";

function AdminDashboardContent() {
	const { user, logout } = useAdminAuth();
	const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
	const mapRef = useRef<any>(null);
	const mapElRef = useRef<HTMLDivElement | null>(null);
	const [markers, setMarkers] = useState<Array<{ type: 'restaurant'|'driver'|'customer'; id?: string; marker: any }>>([]);
	const intervalRef = useRef<any>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const setup = () => {
			initMap();
			setTimeout(() => { try { mapRef.current?.invalidateSize?.(); } catch {} }, 150);
			refreshData();
			if (intervalRef.current) clearInterval(intervalRef.current);
			intervalRef.current = setInterval(refreshData, 10000);
		};

		if ((window as any).L) {
			setup();
		} else {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);
			const script = document.createElement('script');
			script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
			script.async = true;
			script.onload = setup;
			document.body.appendChild(script);
		}

		const onVis = () => {
			if (!document.hidden) {
				try { mapRef.current?.invalidateSize?.(); } catch {}
				refreshData();
			}
		};
		document.addEventListener('visibilitychange', onVis);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
			document.removeEventListener('visibilitychange', onVis);
		};
	}, []);

	const initMap = () => {
		const L = (window as any).L;
		if (!L || !mapElRef.current || mapRef.current) return;
		const map = L.map(mapElRef.current).setView([10.78, 106.70], 12);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; OpenStreetMap'
		}).addTo(map);

		// lightweight emoji-based icons
		(map as any).__icons = {
			restaurant: L.divIcon({
				className: 'restaurant-icon',
				html: '<div style="font-size:22px; line-height:22px">🍽️</div>',
				iconSize: [22, 22],
				iconAnchor: [11, 11]
			}),
			driverBlue: L.divIcon({
				className: 'driver-icon',
				html: '<div style="font-size:20px; line-height:20px; color:#2563eb">🛵</div>',
				iconSize: [20, 20],
				iconAnchor: [10, 10]
			}),
			driverOrange: L.divIcon({
				className: 'driver-icon',
				html: '<div style="font-size:20px; line-height:20px; color:#f97316">🛵</div>',
				iconSize: [20, 20],
				iconAnchor: [10, 10]
			}),
		};
		mapRef.current = map;
	};

	const clearMarkers = () => {
		const L = (window as any).L;
		if (!L) return;
		markers.forEach(m => mapRef.current?.removeLayer(m.marker));
		setMarkers([]);
	};

	const refreshData = async () => {
		try {
			const res = await fetch(`${api}/admin/map`, { credentials: 'include', cache: 'no-store' });
			if (!res.ok) return;
			const json = await res.json();
			const L = (window as any).L;
			if (!L || !mapRef.current) return;
			clearMarkers();
			const next: { type: 'restaurant'|'driver'|'customer'; id?: string; marker: any }[] = [];
			(json?.restaurants || []).forEach((r: any) => {
				const mk = L.marker([r.lat, r.lng], { title: r.name, icon: (mapRef.current as any).__icons.restaurant });
				mk.addTo(mapRef.current).bindPopup(`<b>Quán</b>: ${r.name}`);
				next.push({ type: 'restaurant', id: r.id, marker: mk });
			});
			(json?.drivers || []).forEach((d: any) => {
				const icon = d.isAuto ? (mapRef.current as any).__icons.driverOrange : (mapRef.current as any).__icons.driverBlue;
				const mk = L.marker([d.lat, d.lng], { icon });
				mk.addTo(mapRef.current).bindPopup(`<b>Tài xế</b> (${d.isAuto ? 'Auto' : 'Manual'})`);
				next.push({ type: 'driver', id: d.id, marker: mk });
			});
			// customers (active orders)
			(json?.customers || []).forEach((c: any, idx: number) => {
				const mk = L.divIcon({ className: 'customer-icon', html: '<div style="font-size:18px; line-height:18px">📍</div>', iconSize: [18, 18], iconAnchor: [9, 9] });
				const m = L.marker([c.lat, c.lng], { icon: mk });
				m.addTo(mapRef.current).bindPopup(`<b>Khách hàng</b>`);
				next.push({ type: 'customer', marker: m });
			});
			setMarkers(next);
		} catch {}
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-4">
				<div className="flex justify-between items-center mb-4">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Bản đồ hoạt động</h1>
						<p className="text-gray-600">Xin chào, {user?.name || user?.email}</p>
					</div>
					<button
						onClick={handleLogout}
						className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
					>
						Đăng xuất
					</button>
				</div>

				<div className="mt-2">
					<div ref={mapElRef} className="h-[75vh] w-full rounded-xl border bg-white" />
				</div>
			</div>
		</main>
	);
}

export default function AdminDashboardPage() {
	return (
		<AdminGuard>
			<AdminDashboardContent />
		</AdminGuard>
	);
}
