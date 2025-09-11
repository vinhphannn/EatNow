"use client";

import { useEffect, useState } from "react";

type Address = { label: string; addressLine?: string; latitude?: number; longitude?: number; note?: string; isDefault?: boolean };

export default function ProfilePage() {
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const [name, setName] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [phone, setPhone] = useState<string>("");
	const [avatarUrl, setAvatarUrl] = useState<string>("");
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [addressLabels, setAddressLabels] = useState<string[]>(['Nhà', 'Chỗ làm', 'Nhà mẹ chồng']);
	const [mapOpenIdx, setMapOpenIdx] = useState<number | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string>("");
	const [labelsModalOpen, setLabelsModalOpen] = useState(false);
	const [newLabel, setNewLabel] = useState("");

	useEffect(() => {
		const t = typeof localStorage !== 'undefined' ? localStorage.getItem('eatnow_token') : null;
		setToken(t);
		(async () => {
			try {
				const res = await fetch(`${api}/users/me/profile`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
				if (res.ok) {
					const data = await res.json();
					setName(data?.name || "");
					setEmail(data?.email || "");
					setPhone(data?.phone || "");
					setAvatarUrl(data?.avatarUrl || "");
					setAddresses(Array.isArray(data?.addresses) ? data.addresses : []);
					setAddressLabels(Array.isArray(data?.addressLabels) ? data.addressLabels : ['Nhà', 'Chỗ làm', 'Nhà mẹ chồng']);
					if (data?.avatarUrl) setAvatarPreview(data.avatarUrl);
				}
			} catch {}
		})();
	}, []);

	async function onSaveProfile(e: React.FormEvent) {
		e.preventDefault();
		if (!token) { setMessage('Vui lòng đăng nhập'); return; }
		setLoading(true); setMessage(null);
		try {
			const res = await fetch(`${api}/users/me/profile`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ name, phone, avatarUrl, addresses, addressLabels }),
			});
			if (res.ok) setMessage('Lưu thay đổi thành công');
			else {
				let err = `HTTP ${res.status}`; try { const j = await res.json(); err = j?.message || err; } catch {}
				setMessage(String(err));
			}
		} catch { setMessage('Không thể kết nối máy chủ'); }
		finally { setLoading(false); }
	}

	function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) {
			setAvatarFile(file);
			const reader = new FileReader();
			reader.onload = (e) => setAvatarPreview(e.target?.result as string);
			reader.readAsDataURL(file);
		}
	}

	function addAddress() {
		setAddresses(a => [...a, { label: addressLabels[0] || 'Nhà', addressLine: '', isDefault: a.length === 0 }]);
	}
	function removeAddress(idx: number) {
		setAddresses(a => a.filter((_, i) => i !== idx));
	}
	function setDefault(idx: number) {
		setAddresses(a => a.map((v, i) => ({ ...v, isDefault: i === idx })));
	}

	function addLabel() {
		if (newLabel && newLabel.trim()) {
			setAddressLabels(l => [...l, newLabel.trim()]);
			setNewLabel("");
		}
	}
	function removeLabel(idx: number) {
		setAddressLabels(l => l.filter((_, i) => i !== idx));
	}
	function editLabel(idx: number) {
		const updatedLabel = prompt('Sửa nhãn:', addressLabels[idx]);
		if (updatedLabel && updatedLabel.trim()) {
			setAddressLabels(l => l.map((label, i) => i === idx ? updatedLabel.trim() : label));
		}
	}

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-10">
				<h1 className="text-3xl font-bold text-gray-900">Hồ sơ của tôi</h1>
				<p className="mt-2 text-gray-600">Quản lý thông tin cá nhân, địa chỉ và đơn hàng</p>

				<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
					<section className="card p-6 lg:col-span-1">
						<h2 className="text-lg font-semibold text-gray-800">Thông tin cá nhân</h2>
						<form onSubmit={onSaveProfile} className="mt-4 space-y-3">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-lg font-semibold text-white overflow-hidden">
									{avatarPreview ? (
										<img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
									) : (
										(name || email || 'U').toString().trim().charAt(0).toUpperCase()
									)}
								</div>
								<div className="flex-1">
									<input 
										type="file" 
										accept="image/*" 
										onChange={handleAvatarChange}
										className="w-full rounded-md border px-3 py-2 text-sm"
									/>
									<div className="text-xs text-gray-500 mt-1">Chọn ảnh từ máy tính</div>
								</div>
							</div>
							<div>
								<label className="block text-sm text-gray-600">Họ và tên</label>
								<input className="mt-1 w-full rounded-md border px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Chưa thiết lập" />
							</div>
							<div>
								<label className="block text-sm text-gray-600">Email</label>
								<input className="mt-1 w-full cursor-not-allowed rounded-md border bg-gray-100 px-3 py-2" value={email || 'Không có'} disabled />
							</div>
							<div>
								<label className="block text-sm text-gray-600">Điện thoại</label>
								<input className="mt-1 w-full rounded-md border px-3 py-2" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Chưa thiết lập" />
							</div>
							<button disabled={loading} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
								{loading ? 'Đang lưu...' : 'Lưu thay đổi'}
							</button>
							{message && <div className="text-sm text-gray-700">{message}</div>}
						</form>
					</section>

					<section className="card p-6 lg:col-span-2">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold text-gray-800">Địa chỉ của tôi</h2>
							<div className="flex gap-2">
								<button onClick={() => setLabelsModalOpen(true)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Quản lý nhãn</button>
								<button onClick={addAddress} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Thêm địa chỉ</button>
							</div>
						</div>
						{addresses.length === 0 ? (
							<div className="mt-4 text-sm text-gray-600">Chưa có địa chỉ</div>
						) : (
							<div className="mt-4 space-y-4">
								{addresses.map((addr, idx) => (
									<div key={idx} className="rounded-lg border p-4">
										<div className="flex items-center justify-between">
											<div className="text-sm font-medium text-gray-800">{addr.label || 'Địa chỉ'}</div>
											<div className="flex items-center gap-2">
												{!addr.isDefault && <button onClick={()=>setDefault(idx)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Đặt mặc định</button>}
												<button onClick={()=> setMapOpenIdx(idx)} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Chọn vị trí</button>
												<button onClick={()=> removeAddress(idx)} className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50">Xoá</button>
											</div>
										</div>
										<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
											<div>
												<label className="block text-xs text-gray-600">Nhãn</label>
												<select className="mt-1 w-full rounded-md border px-3 py-2" value={addr.label} onChange={(e)=> setAddresses(a=> a.map((v,i)=> i===idx? { ...v, label: e.target.value }: v))}>
													{addressLabels.map(label => (
														<option key={label} value={label}>{label}</option>
													))}
												</select>
											</div>
											<div>
												<label className="block text-xs text-gray-600">Địa chỉ</label>
												<input className="mt-1 w-full rounded-md border px-3 py-2" value={addr.addressLine || ''} onChange={(e)=> setAddresses(a=> a.map((v,i)=> i===idx? { ...v, addressLine: e.target.value }: v))} placeholder="Chưa thiết lập" />
											</div>
											<div>
												<label className="block text-xs text-gray-600">Ghi chú</label>
												<input className="mt-1 w-full rounded-md border px-3 py-2" value={addr.note || ''} onChange={(e)=> setAddresses(a=> a.map((v,i)=> i===idx? { ...v, note: e.target.value }: v))} placeholder="Hướng dẫn giao hàng, tầng, phòng..." />
											</div>
											<div className="flex items-center gap-2 text-xs text-gray-600">
												{typeof addr.latitude === 'number' && typeof addr.longitude === 'number' ? (
													<span>📍 {addr.latitude.toFixed(5)}, {addr.longitude.toFixed(5)}</span>
												) : (
													<span>Chưa chọn vị trí</span>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</section>
				</div>

				{mapOpenIdx !== null && (
					<MapPickerModal
						latitude={typeof addresses[mapOpenIdx!]?.latitude === 'number' ? addresses[mapOpenIdx!].latitude : undefined}
						longitude={typeof addresses[mapOpenIdx!]?.longitude === 'number' ? addresses[mapOpenIdx!].longitude : undefined}
						onClose={()=> setMapOpenIdx(null)}
						onPick={(lat,lng)=> { setAddresses(a=> a.map((v,i)=> i===mapOpenIdx ? { ...v, latitude: lat, longitude: lng } : v)); setMapOpenIdx(null); }}
					/>
				)}

				{labelsModalOpen && (
					<LabelsModal
						labels={addressLabels}
						onClose={() => setLabelsModalOpen(false)}
						onEdit={editLabel}
						onRemove={removeLabel}
						onAdd={addLabel}
						newLabel={newLabel}
						setNewLabel={setNewLabel}
					/>
				)}
			</div>
		</main>
	);
}

function MapPickerModal({ latitude, longitude, onClose, onPick }: { latitude?: number; longitude?: number; onClose: ()=>void; onPick: (lat:number,lng:number)=>void }) {
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

function LabelsModal({ labels, onClose, onEdit, onRemove, onAdd, newLabel, setNewLabel }: {
	labels: string[];
	onClose: () => void;
	onEdit: (idx: number) => void;
	onRemove: (idx: number) => void;
	onAdd: () => void;
	newLabel: string;
	setNewLabel: (value: string) => void;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">Quản lý nhãn địa chỉ</h3>
					<button onClick={onClose} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Đóng</button>
				</div>
				
				<div className="space-y-3">
					{labels.map((label, idx) => (
						<div key={idx} className="flex items-center justify-between rounded-lg border p-3">
							<span className="text-sm text-gray-800">{label}</span>
							<div className="flex gap-2">
								<button 
									onClick={() => onEdit(idx)} 
									className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
								>
									Sửa
								</button>
								<button 
									onClick={() => onRemove(idx)} 
									className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
								>
									Xóa
								</button>
							</div>
						</div>
					))}
				</div>

				<div className="mt-6 border-t pt-4">
					<div className="flex gap-2">
						<input
							type="text"
							value={newLabel}
							onChange={(e) => setNewLabel(e.target.value)}
							placeholder="Nhập nhãn mới..."
							className="flex-1 rounded-md border px-3 py-2 text-sm"
							onKeyPress={(e) => e.key === 'Enter' && onAdd()}
						/>
						<button 
							onClick={onAdd}
							className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
						>
							Thêm
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}