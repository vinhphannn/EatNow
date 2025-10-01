'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
	const [mapOpen, setMapOpen] = useState(false);

	useEffect(() => {
		loadProfile();
	}, []);

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
					longitude
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
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('eatnow_restaurant_id');
			localStorage.removeItem('eatnow_user');
		}
		router.push('/restaurant/login');
	}

	return (
		<div className="mx-auto max-w-2xl">
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
				<div className="flex items-center gap-3">
					<button type="button" className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50" onClick={() => setMapOpen(true)}>Chọn vị trí trên bản đồ</button>
					{latitude && longitude && (
						<span className="text-sm text-gray-600">Đã chọn: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
					)}
				</div>
				<button className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
			</form>

			{mapOpen && (
				<MapPickerModal
					latitude={latitude}
					longitude={longitude}
					address={address}
					onClose={()=> setMapOpen(false)}
					onPick={(lat, lng) => { setLatitude(lat); setLongitude(lng); setMapOpen(false); }}
				/>
			)}
		</div>
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