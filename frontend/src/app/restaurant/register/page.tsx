"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantRegisterPage() {
	const router = useRouter();
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [restaurantName, setRestaurantName] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setMessage(null);
		try {
			const res = await fetch(`${api}/users/register-restaurant`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name, phone, restaurantName })
			});
			if (!res.ok) {
				let err = `HTTP ${res.status}`;
				try { const j = await res.json(); err = Array.isArray(j?.message) ? j.message.join(', ') : (j?.message || err); } catch {}
				setMessage(String(err));
				return;
			}
			const reg = await res.json();
			// Lưu ngay restaurantId từ response
			if (reg?.restaurantId && typeof localStorage !== 'undefined') {
				localStorage.setItem('eatnow_restaurant_id', reg.restaurantId);
			}
			// Auto-login để có token
			try {
				const lr = await fetch(`${api}/auth/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password })
				});
				if (lr.ok) {
					const data = await lr.json();
					if (typeof localStorage !== 'undefined') {
						localStorage.setItem('eatnow_token', data?.accessToken || data?.access_token || data?.token || '');
						if (data?.user) localStorage.setItem('eatnow_user', JSON.stringify(data.user));
					}
				}
			} catch {}
			router.push('/restaurant/dashboard');
		} catch (e: any) {
			setMessage('Không thể kết nối máy chủ');
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="min-h-screen">
			<div className="mx-auto max-w-md px-4 py-10">
				<h1 className="text-2xl font-bold text-gray-900">Đăng ký Nhà hàng</h1>
				<form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
					<div>
						<label className="block text-sm text-gray-600">Tên chủ quán</label>
						<input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Email</label>
						<input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-md border px-3 py-2" required />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Số điện thoại</label>
						<input value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Mật khẩu</label>
						<input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-md border px-3 py-2" required />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Tên nhà hàng</label>
						<input value={restaurantName} onChange={(e)=>setRestaurantName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
					</div>
					<button disabled={loading} className="btn-primary">{loading ? 'Đang đăng ký...' : 'Đăng ký'}</button>
					{message && <div className="text-sm text-red-600">{message}</div>}
				</form>
			</div>
		</main>
	);
}


