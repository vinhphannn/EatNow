"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantLoginPage() {
	const router = useRouter();
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setMessage(null);
		try {
			const res = await fetch(`${api}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (res.ok) {
				const data = await res.json();
				const token = data?.accessToken || data?.access_token || data?.token || '';
				const role = data?.user?.role;
				if (role !== 'restaurant') {
					setMessage('Tài khoản này không thuộc loại Nhà hàng. Vui lòng đăng nhập ở cổng phù hợp.');
					return;
				}
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem('eatnow_token', token);
					if (data?.user) localStorage.setItem('eatnow_user', JSON.stringify(data.user));
					try {
						const userId = data?.user?.id;
						if (userId) {
							const r = await fetch(`${api}/restaurants?ownerUserId=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
							const list = r.ok ? await r.json() : [];
							const first = Array.isArray(list) && list.length ? list[0] : null;
							if (first?.id) localStorage.setItem('eatnow_restaurant_id', first.id);
						}
					} catch {}
				}
				router.push('/restaurant/dashboard');
			} else {
				let err = `HTTP ${res.status}`;
				try { const j = await res.json(); err = j?.message || err; } catch {}
				setMessage(String(err));
			}
		} catch (e: any) {
			setMessage('Không thể kết nối máy chủ');
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="min-h-screen">
			<div className="mx-auto max-w-md px-4 py-10">
				<h1 className="text-2xl font-bold text-gray-900">Đăng nhập Nhà hàng</h1>
				<form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
					<div>
						<label className="block text-sm text-gray-600">Email</label>
						<input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-md border px-3 py-2" required />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Mật khẩu</label>
						<input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-md border px-3 py-2" required />
					</div>
					<button disabled={loading} className="btn-primary">{loading? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
					{message && <div className="text-sm text-red-600">{message}</div>}
				</form>
			</div>
		</main>
	);
}
