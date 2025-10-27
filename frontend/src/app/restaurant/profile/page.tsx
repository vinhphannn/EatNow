'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

export default function RestaurantProfilePage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [address, setAddress] = useState('');
	const [openTime, setOpenTime] = useState('');
	const [closeTime, setCloseTime] = useState('');
	const [openDays, setOpenDays] = useState<number[]>([]);
	const [latitude, setLatitude] = useState<number>();
	const [longitude, setLongitude] = useState<number>();
	const [imageUrl, setImageUrl] = useState('');

	useEffect(() => {
		loadProfile();
	}, []);

	// Render mini map when location is set
	useEffect(() => {
		if (latitude && longitude) {
			let mapInstance: any = null;
			
			const initMap = () => {
				if ((window as any).L) {
					const L = (window as any).L;
					const container = document.getElementById('mini-map-preview');
					if (container && !container.hasAttribute('data-leaflet-initialized')) {
						container.setAttribute('data-leaflet-initialized', 'true');
						mapInstance = L.map(container).setView([latitude, longitude], 15);
						L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
						L.marker([latitude, longitude]).addTo(mapInstance);
					}
				} else {
					const script = document.createElement('script');
					script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
					script.onload = () => {
						const L = (window as any).L;
						const container = document.getElementById('mini-map-preview');
						if (container && !container.hasAttribute('data-leaflet-initialized')) {
							container.setAttribute('data-leaflet-initialized', 'true');
							mapInstance = L.map(container).setView([latitude, longitude], 15);
							L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
							L.marker([latitude, longitude]).addTo(mapInstance);
						}
					};
					document.head.appendChild(script);
					
					const link = document.createElement('link');
					link.rel = 'stylesheet';
					link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
					document.head.appendChild(link);
				}
			};
			
			initMap();
			
			return () => {
				if (mapInstance) {
					try {
						mapInstance.remove();
					} catch (e) {
						// Ignore cleanup errors
					}
				}
			};
		}
	}, [latitude, longitude]);

	const loadProfile = async () => {
		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/restaurants/mine`, {
				credentials: 'include',
			});

			console.log('Profile API response status:', response.status);
			console.log('Profile API response headers:', response.headers.get('content-type'));

			if (response.ok) {
				const responseText = await response.text();
				console.log('Profile API response text:', responseText);
				
				if (responseText.trim()) {
					try {
						const restaurant = JSON.parse(responseText);
						setName(restaurant.name || '');
						setDescription(restaurant.description || '');
						setAddress(restaurant.address || '');
						setOpenTime(restaurant.openTime || '');
						setCloseTime(restaurant.closeTime || '');
						setOpenDays(restaurant.openDays || []);
						setLatitude(restaurant.latitude);
						setLongitude(restaurant.longitude);
						setImageUrl(restaurant.imageUrl || '');
					} catch (jsonError) {
						console.error('JSON parsing error in loadProfile:', jsonError);
						// Set default values if JSON parsing fails
						setName('Nhà hàng của tôi');
						setDescription('');
						setAddress('');
						setOpenTime('08:00');
						setCloseTime('22:00');
						setOpenDays([1, 2, 3, 4, 5, 6, 7]);
					}
				} else {
					console.warn('Empty response from profile API');
					// Set default values for empty response
					setName('Nhà hàng của tôi');
					setDescription('');
					setAddress('');
					setOpenTime('08:00');
					setCloseTime('22:00');
					setOpenDays([1, 2, 3, 4, 5, 6, 7]);
				}
			} else {
				console.error('Profile API error:', response.status, response.statusText);
				const errorText = await response.text();
				console.error('Profile API error response:', errorText);
			}
		} catch (error) {
			console.error('Load profile error:', error);
		}
	};

	const onSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/restaurants/mine`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					name,
					description,
					address,
					openTime,
					closeTime,
					openDays,
					latitude,
					longitude,
					imageUrl
				})
			});

			if (response.ok) {
				alert('Lưu thay đổi thành công!');
			} else {
				alert('Có lỗi xảy ra khi lưu thay đổi');
			}
		} catch (error) {
			console.error('Save profile error:', error);
			alert('Có lỗi xảy ra khi lưu thay đổi');
		} finally {
			setLoading(false);
		}
	};

	const toggleOpenDay = (day: number) => {
		setOpenDays(prev => 
			prev.includes(day) 
				? prev.filter(d => d !== day)
				: [...prev, day]
		);
	};

	const onLogout = async () => {
		try {
			await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
		} catch {}
		// Cookie-based auth: cookies are automatically cleared by backend
		router.push('/restaurant/login');
	}

	return (
		<div className="mx-auto max-w-2xl">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-gray-900">Hồ sơ Nhà hàng</h1>
				<button onClick={onLogout} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Đăng xuất</button>
			</div>

			<form onSubmit={onSave} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
				{/* Avatar Upload Section */}
				<div className="pb-6 border-b">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Ảnh đại diện nhà hàng
					</label>
					<ImageUpload
						value={imageUrl}
						onChange={setImageUrl}
						placeholder="Chọn ảnh đại diện nhà hàng..."
						className="w-full h-64 rounded-lg"
					/>
					<p className="text-xs text-gray-500 mt-2 text-center">
						Kéo thả, click chọn, hoặc Ctrl+V để dán ảnh • JPG, PNG (tối đa 2MB)
					</p>
				</div>

				<div>
					<label className="block text-sm text-gray-600">Tên nhà hàng</label>
					<input className="mt-1 w-full rounded-md border px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required />
				</div>
				<div>
					<label className="block text-sm text-gray-600">Mô tả</label>
					<textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={3} value={description} onChange={(e)=>setDescription(e.target.value)}></textarea>
				</div>
				<div>
					<label className="block text-sm text-gray-600">Địa chỉ</label>
					<input className="mt-1 w-full rounded-md border px-3 py-2" value={address} onChange={(e)=>setAddress(e.target.value)} />
				</div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label className="block text-sm text-gray-600">Mở lúc</label>
						<input className="mt-1 w-full rounded-md border px-3 py-2" type="time" value={openTime} onChange={(e)=>setOpenTime(e.target.value)} />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Đóng lúc</label>
						<input className="mt-1 w-full rounded-md border px-3 py-2" type="time" value={closeTime} onChange={(e)=>setCloseTime(e.target.value)} />
					</div>
				</div>
				<div>
					<label className="block text-sm text-gray-600">Ngày mở cửa</label>
					<div className="mt-2 flex flex-wrap gap-2 text-sm">
						{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
							<button key={day} type="button" className={`rounded border px-2 py-1 hover:bg-gray-50 ${openDays.includes(idx) ? 'bg-orange-100 border-orange-300' : ''}`} onClick={() => toggleOpenDay(idx)}>{day}</button>
						))}
					</div>
				</div>
				{/* Location Section */}
				<div>
					<label className="block text-sm text-gray-600 mb-2">Vị trí nhà hàng</label>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Map Preview */}
						<div className="relative h-48 border rounded-lg overflow-hidden">
							{latitude && longitude ? (
								<div id="mini-map-preview" className="w-full h-full"></div>
							) : (
								<div className="flex items-center justify-center h-full bg-gray-100">
									<p className="text-gray-400 text-sm">Chưa chọn vị trí</p>
								</div>
							)}
						</div>
						
						{/* Location Info */}
						<div className="space-y-3">
							{latitude && longitude && (
								<div className="p-3 bg-orange-50 rounded-lg">
									<p className="text-xs text-gray-600 mb-1">Tọa độ đã chọn</p>
									<p className="text-sm font-mono text-gray-800">
										{latitude.toFixed(6)}, {longitude.toFixed(6)}
									</p>
								</div>
							)}
							<LocationPicker
								latitude={latitude}
								longitude={longitude}
								onPick={(lat, lng) => {
									setLatitude(lat);
									setLongitude(lng);
								}}
							/>
						</div>
					</div>
				</div>
				<button className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
			</form>
		</div>
	);
}

function LocationPicker({ latitude, longitude, onPick }: { latitude?: number; longitude?: number; onPick: (lat: number, lng: number) => void }) {
	const [mapOpen, setMapOpen] = useState(false);

	return (
		<>
			<button 
				type="button" 
				className="w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
				onClick={() => setMapOpen(true)}
			>
				<span>🗺️</span>
				{latitude && longitude ? 'Thay đổi vị trí' : 'Chọn vị trí trên bản đồ'}
			</button>
			
			{mapOpen && (
				<MapPickerModal
					latitude={latitude}
					longitude={longitude}
					address=""
					onClose={() => setMapOpen(false)}
					onPick={(lat, lng) => { 
						onPick(lat, lng);
						setMapOpen(false);
					}}
				/>
			)}
		</>
	);
}

function MapPickerModal({ latitude, longitude, address, onClose, onPick }: { latitude?: number; longitude?: number; address?: string; onClose: ()=>void; onPick: (lat: number, lng: number)=>void }) {
	const [loaded, setLoaded] = useState(false);
	const [map, setMap] = useState<any>(null);

	useEffect(() => {
		if (!loaded) {
			const script = document.createElement('script');
			script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
			script.onload = () => {
				const L = (window as any).L;
				if (L && !map) {
					const mapInstance = L.map('map-canvas').setView([latitude || 10.8231, longitude || 106.6297], 13);
					L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
					setMap(mapInstance);

					if (latitude && longitude) {
						L.marker([latitude, longitude]).addTo(mapInstance);
					}

					mapInstance.on('click', (e: any) => {
						mapInstance.eachLayer((layer: any) => {
							if (layer instanceof L.Marker) {
								mapInstance.removeLayer(layer);
							}
						});
						L.marker([e.latlng.lat, e.latlng.lng]).addTo(mapInstance);
						onPick(e.latlng.lat, e.latlng.lng);
					});
				}
				setLoaded(true);
			};
			document.head.appendChild(script);

			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);
		}
	}, [loaded, latitude, longitude, onPick, map]);

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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