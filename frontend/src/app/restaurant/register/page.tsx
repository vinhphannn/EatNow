'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RestaurantRegisterPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [restaurantName, setRestaurantName] = useState('');

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage('');

		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/restaurants/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name,
					email,
					password,
					restaurantName
				})
			});

			const data = await response.json();
			
			if (response.ok) {
				setMessage('Đăng ký thành công! Đang chuyển hướng...');
				setTimeout(() => {
					router.push('/restaurant/login');
				}, 2000);
			} else {
				setMessage(data.message || 'Có lỗi xảy ra khi đăng ký');
			}
		} catch (error) {
			console.error('Register error:', error);
			setMessage('Có lỗi xảy ra khi đăng ký');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="mx-auto max-w-md">
			<h1 className="text-2xl font-bold text-gray-900">Đăng ký Nhà hàng</h1>
			<form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
				<div>
					<label className="block text-sm text-gray-600">Tên chủ quán</label>
					<input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
				</div>
				<div>
					<label className="block text-sm text-gray-600">Email</label>
					<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
				</div>
				<div>
					<label className="block text-sm text-gray-600">Mật khẩu</label>
					<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
				</div>
				<div>
					<label className="block text-sm text-gray-600">Tên nhà hàng</label>
					<input value={restaurantName} onChange={(e)=>setRestaurantName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
				</div>
				<button disabled={loading} className="btn-primary">{loading ? 'Đang đăng ký...' : 'Đăng ký'}</button>
				{message && <div className="text-sm text-red-600">{message}</div>}
			</form>
		</div>
	);
}