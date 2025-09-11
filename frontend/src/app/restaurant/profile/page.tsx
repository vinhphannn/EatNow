"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantProfilePage() {
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	const router = useRouter();
	const [token, setToken] = useState<string | null>(null);
	const [restaurantId, setRestaurantId] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [address, setAddress] = useState("");
	const [openingHours, setOpeningHours] = useState("");
	const [openTime, setOpenTime] = useState("");
	const [closeTime, setCloseTime] = useState("");
	const [openDays, setOpenDays] = useState<number[]>([]);
	const [latitude, setLatitude] = useState<number | "">("");
	const [longitude, setLongitude] = useState<number | "">("");
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [mapOpen, setMapOpen] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const t = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_token') : null;
				let rid = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_restaurant_id') : null;
				setToken(t);
				if (!rid) {
					// Try resolve by current user
					const u = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_user') : null;
					if (u) {
						const user = JSON.parse(u);
						if (user?.id) {
							// Prefer /restaurants/mine when token available
							if (t) {
								try {
									const mine = await fetch(`${api}/restaurants/mine`, { headers: { Authorization: `Bearer ${t}` } });
									if (mine.ok) {
										const data = await mine.json();
										const resolved = data?.id || data?._id || data?._id?.$oid;
										if (resolved) {
											rid = resolved;
											if (typeof localStorage !== 'undefined') localStorage.setItem('eatnow_restaurant_id', rid);
										}
									}
								} catch {}
							}
							if (!rid) {
								try {
									const r = await fetch(`${api}/restaurants?ownerUserId=${user.id}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
									if (r.ok) {
										const list = await r.json();
										const first = Array.isArray(list) && list.length ? list[0] : null;
										const resolved = first?.id || first?._id || first?._id?.$oid;
										if (resolved) {
											rid = resolved;
											if (typeof localStorage !== 'undefined') localStorage.setItem('eatnow_restaurant_id', rid);
										}
									}
								} catch {}
							}
						}
					}
				}
				if (rid) setRestaurantId(rid);
				if (!rid) return;
				try {
					const r = await fetch(`${api}/restaurants/${rid}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
					if (r.ok) {
						const data = await r.json();
						setName(data?.name || "");
						setDescription(data?.description || "");
						setAddress(data?.address || "");
						setOpeningHours(data?.openingHours || "");
						setOpenTime(data?.openTime || "");
						setCloseTime(data?.closeTime || "");
						setOpenDays(Array.isArray(data?.openDays) ? data.openDays : []);
						setLatitude(typeof data?.latitude === 'number' ? data.latitude : "");
						setLongitude(typeof data?.longitude === 'number' ? data.longitude : "");
					}
				} catch {}
			} catch {}
		})();
	}, []);

	async function onSave(e: React.FormEvent) {
		e.preventDefault();
		if (!restaurantId) return;
		setLoading(true);
		setMessage(null);
		try {
			const res = await fetch(`${api}/restaurants/${restaurantId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
				body: JSON.stringify({ name, description, address, openingHours, openTime, closeTime, openDays, latitude: typeof latitude==='number'?latitude:undefined, longitude: typeof longitude==='number'?longitude:undefined }),
			});
			if (res.ok) {
				setMessage('Lưu thay đổi thành công');
			} else {
				let err = `HTTP ${res.status}`;
				try { const j = await res.json(); err = j?.message || err; } catch {}
				setMessage(String(err));
			}
		} catch {
			setMessage('Không thể kết nối máy chủ');
		} finally {
			setLoading(false);
		}
	}

	function onLogout() {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('eatnow_token');
			localStorage.removeItem('eatnow_user');
			localStorage.removeItem('eatnow_restaurant_id');
		}
		router.push('/restaurant/login');
	}

	return (
		<main className="min-h-screen">
			<div className="mx-auto max-w-2xl px-4 py-8">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold text-gray-900">Hồ sơ Nhà hàng</h1>
					<button onClick={onLogout} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Đăng xuất</button>
				</div>

				<form onSubmit={onSave} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
					<div>
						<label className="block text-sm text-gray-600">Tên nhà hàng</label>
						<input className="mt-1 w-full rounded-md border px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Mô tả</label>
						<textarea className="mt-1 w-full rounded-md border px-3 py-2" value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Địa chỉ</label>
						<input className="mt-1 w-full rounded-md border px-3 py-2" value={address} onChange={(e)=>setAddress(e.target.value)} />
					</div>
					{/* Removed free-text opening hours; using open/close pickers below */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-sm text-gray-600">Mở lúc</label>
							<input type="time" className="mt-1 w-full rounded-md border px-3 py-2" value={openTime} onChange={(e)=>setOpenTime(e.target.value)} />
						</div>
						<div>
							<label className="block text-sm text-gray-600">Đóng lúc</label>
							<input type="time" className="mt-1 w-full rounded-md border px-3 py-2" value={closeTime} onChange={(e)=>setCloseTime(e.target.value)} />
						</div>
					</div>
					<div>
						<label className="block text-sm text-gray-600">Ngày mở cửa</label>
						<div className="mt-2 flex flex-wrap gap-2 text-sm">
							{['CN','T2','T3','T4','T5','T6','T7'].map((label, idx) => (
								<button key={idx} type="button" onClick={()=> setOpenDays(s=> s.includes(idx) ? s.filter(x=>x!==idx) : [...s,idx])} className={`rounded border px-2 py-1 ${openDays.includes(idx)?'bg-gray-900 text-white':'hover:bg-gray-50'}`}>{label}</button>
							))}
						</div>
					</div>
					{/* Removed manual lat/lng inputs; using interactive map picker instead */}
					<div className="flex items-center gap-3">
						<button type="button" onClick={()=> setMapOpen(true)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Chọn vị trí trên bản đồ</button>
						{typeof latitude==='number' && typeof longitude==='number' && <span className="text-sm text-gray-600">({latitude.toFixed(5)}, {longitude.toFixed(5)})</span>}
					</div>
					{typeof latitude==='number' && typeof longitude==='number' && (
						<div className="mt-2">
							<div className="w-full rounded-lg border bg-gray-100 p-4 text-center text-sm text-gray-600">
								📍 Vị trí: {latitude.toFixed(5)}, {longitude.toFixed(5)}
								<br />
								<small>Bản đồ tương tác sẽ hiển thị khi chọn vị trí</small>
							</div>
						</div>
					)}
					<button disabled={loading} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
						{loading ? 'Đang lưu...' : 'Lưu thay đổi'}
					</button>
					{message && <div className="text-sm text-gray-700">{message}</div>}
				</form>
				{mapOpen && (
					<MapPickerModal
						latitude={typeof latitude==='number' ? latitude : undefined}
						longitude={typeof longitude==='number' ? longitude : undefined}
						address={address}
						onClose={()=> setMapOpen(false)}
						onPick={(lat, lng) => { setLatitude(lat); setLongitude(lng); setMapOpen(false); }}
					/>
				)}
			</div>
		</main>
	);
}


function MapPickerModal({ latitude, longitude, address, onClose, onPick }: { latitude?: number; longitude?: number; address?: string; onClose: ()=>void; onPick: (lat: number, lng: number)=>void }) {
	const [loaded, setLoaded] = useState(false);
	const [map, setMap] = useState<any>(null);
	const [marker, setMarker] = useState<any>(null);

	useEffect(() => {
		// Load Leaflet CSS and JS
		if (document.getElementById('leaflet-css')) {
			setLoaded(true);
			return;
		}

		// Load CSS
		const css = document.createElement('link');
		css.id = 'leaflet-css';
		css.rel = 'stylesheet';
		css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
		document.head.appendChild(css);

		// Load JS
		const script = document.createElement('script');
		script.id = 'leaflet-js';
		script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
		script.onload = () => setLoaded(true);
		document.body.appendChild(script);

		return () => {
			// Cleanup
			const cssEl = document.getElementById('leaflet-css');
			const jsEl = document.getElementById('leaflet-js');
			if (cssEl) cssEl.remove();
			if (jsEl) jsEl.remove();
		};
	}, []);

	useEffect(() => {
		if (!loaded || !(window as any).L) return;

		const L = (window as any).L;
		const center = [latitude ?? 10.776, longitude ?? 106.700];
		
		// Initialize map
		const mapInstance = L.map('map-canvas').setView(center, 15);
		setMap(mapInstance);

		// Add OpenStreetMap tiles
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors'
		}).addTo(mapInstance);

		// Add initial marker
		const initialMarker = L.marker(center).addTo(mapInstance);
		setMarker(initialMarker);

		// Click to set marker
		mapInstance.on('click', (e: any) => {
			const { lat, lng } = e.latlng;
			if (marker) {
				mapInstance.removeLayer(marker);
			}
			const newMarker = L.marker([lat, lng]).addTo(mapInstance);
			setMarker(newMarker);
			onPick(lat, lng);
		});

		return () => {
			if (mapInstance) {
				mapInstance.remove();
			}
		};
	}, [loaded, latitude, longitude, onPick]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-full max-w-3xl rounded-xl border bg-white p-4 shadow-xl">
				<div className="mb-2 flex items-center justify-between">
					<div className="text-lg font-semibold text-gray-900">Chọn vị trí trên bản đồ</div>
					<button onClick={onClose} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Đóng</button>
				</div>
				<div id="map-canvas" className="h-[480px] w-full rounded-lg border" />
				<div className="mt-2 text-xs text-gray-500">Nhấp vào bản đồ để ghim vị trí. Sử dụng OpenStreetMap miễn phí.</div>
			</div>
		</div>
	);
}

