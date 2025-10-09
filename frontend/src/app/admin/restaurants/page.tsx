"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type R = { id: string; name: string; status: string; ownerUserId?: string; city?: string; createdAt?: string };

export default function AdminRestaurantsPage() {
	const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

	const [q, setQ] = useState<string>("");
	const [status, setStatus] = useState<string>("");
	const [sort, setSort] = useState<string>("createdAt:desc");
	const [page, setPage] = useState<number>(1);
	const [limit, setLimit] = useState<number>(10);

	const [data, setData] = useState<R[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const query = useMemo(() => {
		const p = new URLSearchParams();
		p.set('page', String(page));
		p.set('limit', String(limit));
		if (q) p.set('q', q);
		if (status) p.set('status', status);
		if (sort) p.set('sort', sort);
		return p.toString();
	}, [page, limit, q, status, sort]);

	useEffect(() => {
		const ctrl = new AbortController();
		(async () => {
			setLoading(true); setError(null);
			try {
                const res = await fetch(`${api}/admin/restaurants?${query}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json = await res.json();
				setData(Array.isArray(json?.data) ? json.data : []);
                setTotal(Number(json?.meta?.total ?? json?.total ?? 0));
			} catch (e: any) {
				if (e?.name === 'AbortError') return;
				setError(e?.message || 'Tải dữ liệu thất bại');
				setData([]); setTotal(0);
			} finally {
				setLoading(false);
			}
		})();
		return () => ctrl.abort();
	}, [api, query]);

	const updateStatus = async (id: string, nextStatus: string) => {
		try {
			const res = await fetch(`${api}/restaurants/${id}`, {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: nextStatus })
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			// optimistic refresh row
			setData(curr => curr.map(r => r.id === id ? { ...r, status: nextStatus } : r));
		} catch (e) {
			console.error('Update status failed', e);
			alert('Không thể cập nhật trạng thái');
		}
	};

	const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Quản lý Nhà hàng</h1>
				{/* Toolbar */}
				<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<div className="relative">
							<input value={q} onChange={(e)=> { setPage(1); setQ(e.target.value); }} placeholder="Tìm theo tên / email chủ quán" className="w-64 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
							<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
						</div>
						<select value={status} onChange={(e)=> { setPage(1); setStatus(e.target.value); }} className="rounded-lg border px-3 py-2 text-sm">
							<option value="">Tất cả trạng thái</option>
							<option value="active">Active</option>
							<option value="pending">Pending</option>
							<option value="suspended">Suspended</option>
						</select>
					</div>
					<div className="flex items-center gap-2">
						<button onClick={()=> setSort(s=> s==='createdAt:desc' ? 'createdAt:asc' : 'createdAt:desc')} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Sắp xếp: {sort.endsWith('desc') ? 'Mới nhất' : 'Cũ nhất'}</button>
					</div>
				</div>

				{error && <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

				<div className="mt-4 overflow-x-auto rounded-xl border bg-white">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-left text-gray-600">
							<tr>
								<th className="px-4 py-3">Tên</th>
								<th className="px-4 py-3">Chủ quán</th>
								<th className="px-4 py-3">Thành phố</th>
								<th className="px-4 py-3">Trạng thái</th>
								<th className="px-4 py-3">Ngày tạo</th>
								<th className="px-4 py-3">Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{loading && (
								<tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Đang tải...</td></tr>
							)}
							{!loading && data.map((r)=> (
								<tr key={r.id} className="border-t">
									<td className="px-4 py-3 font-medium text-gray-900"><Link className="text-orange-600 hover:underline" href={`/admin/restaurants/${r.id}`}>{r.name}</Link></td>
									<td className="px-4 py-3 text-gray-600">{r.ownerUserId || ''}</td>
									<td className="px-4 py-3 text-gray-600">{r.city || ''}</td>
									<td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${r.status==='active'?'bg-green-100 text-green-700': r.status==='pending'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-700'}`}>{r.status}</span></td>
									<td className="px-4 py-3 text-gray-600">{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : ''}</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											{r.status !== 'active' && (
												<button onClick={()=> updateStatus(r.id, 'active')} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">Kích hoạt</button>
											)}
											{r.status === 'active' && (
												<button onClick={()=> updateStatus(r.id, 'suspended')} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">Tạm dừng</button>
											)}
											<Link href={`/admin/restaurants/${r.id}`} className="rounded-md bg-orange-600 px-2 py-1 text-xs text-white hover:bg-orange-700">Chi tiết</Link>
										</div>
									</td>
								</tr>
							))}
							{!loading && data.length === 0 && (
								<tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="mt-4 flex items-center justify-between">
					<div className="text-sm text-gray-600">Trang {page} / {totalPages} • Tổng {total}</div>
					<div className="flex items-center gap-2">
						<button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Prev</button>
						<button disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages, p+1))} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
						<select value={limit} onChange={(e)=> { setPage(1); setLimit(Number(e.target.value)); }} className="rounded-lg border px-2 py-1 text-sm">
							<option value={10}>10</option>
							<option value={20}>20</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>
					</div>
				</div>
			</div>
		</main>
	);
}
