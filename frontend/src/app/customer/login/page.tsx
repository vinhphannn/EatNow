"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthManager } from '@/utils/authManager';

export default function CustomerLoginPage() {
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setMessage(null);
		try {
			const res = await fetch(`${api}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password })
			});
			if (!res.ok) {
				let err = `HTTP ${res.status}`;
				try { const j = await res.json(); err = j?.message || err; } catch {}
				setMessage(String(err));
				return;
			}
			const data = await res.json();
			const token = data?.access_token || data?.token;
			const user = data?.user || data?.profile || null;
			if (!token || !user) {
				setMessage("Phản hồi đăng nhập không hợp lệ");
				return;
			}
			// Role guard: only allow customer on customer portal
			const role = user.role || user.type || user?.roles?.[0];
			if (String(role) !== "customer") {
				setMessage("Tài khoản không thuộc cổng Khách hàng. Vui lòng dùng đúng cổng.");
				return;
			}
			if (typeof localStorage !== 'undefined') {
				// Lưu auth riêng cho customer
				AuthManager.setCustomerAuth(token, { id: user.id || user._id || user?._id?.$oid, name: user.name || user.fullName || user.email, email: user.email, role: 'customer' });
			}
			router.push('/customer');
		} catch {
			setMessage("Không thể kết nối tới máy chủ");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto max-w-xl px-4 py-10">
				<h1 className="text-3xl font-bold text-gray-900">Đăng nhập</h1>
				<p className="text-gray-600 mt-2">Truy cập cổng Khách hàng để đặt món</p>

				<form onSubmit={onSubmit} className="mt-8 space-y-4 bg-white rounded-xl border p-6 shadow-sm">
					<div>
						<label className="block text-sm text-gray-600">Email</label>
						<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="ban@vidu.com" required />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Mật khẩu</label>
						<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="••••••••" required />
					</div>
					<button disabled={loading} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
						{loading ? "Đang xử lý..." : "Đăng nhập"}
					</button>
					{message && <div className="text-sm text-red-600">{message}</div>}
					<div className="text-sm text-gray-600">
						Chưa có tài khoản? <a className="text-orange-600 hover:underline" href="/customer/register">Đăng ký</a>
					</div>
				</form>
			</div>
		</main>
	);
}


