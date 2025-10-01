"use client";
import { useEffect, useState } from "react";

type U = { id: string; email: string; role: string; name?: string; phone?: string; createdAt?: string };

export default function AdminUsersPage() {
	const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	const [users, setUsers] = useState<U[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			setError(null);
			try {
				const res = await fetch(`${api}/users`);
				if (!res.ok) { setError(`HTTP ${res.status}`); setUsers([]); return; }
				const data = await res.json();
				setUsers(Array.isArray(data) ? data : []);
			} catch {
				setError('Không thể tải danh sách người dùng');
				setUsers([]);
			}
		})();
	}, []);

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
				{error && <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
				<div className="mt-6 overflow-x-auto rounded-xl border bg-white">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-left text-gray-600">
							<tr>
								<th className="px-4 py-3">Tên</th>
								<th className="px-4 py-3">Email</th>
								<th className="px-4 py-3">Vai trò</th>
								<th className="px-4 py-3">Ngày tạo</th>
							</tr>
						</thead>
						<tbody>
							{(users||[]).map((u)=> (
								<tr key={u.id} className="border-t">
									<td className="px-4 py-3">{u.name || '(Chưa có)'}</td>
									<td className="px-4 py-3">{u.email}</td>
									<td className="px-4 py-3">{u.role}</td>
									<td className="px-4 py-3">{u.createdAt ? new Date(u.createdAt).toLocaleString('vi-VN') : ''}</td>
								</tr>
							))}
							{users && users.length === 0 && (
								<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>
							)}
							{!users && (
								<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Đang tải...</td></tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</main>
	);
}
