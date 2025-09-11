"use client";
import { useState } from "react";
import Link from "next/link";

export default function AdminSettingsPage() {
	const [freepick, setFreepick] = useState(true);
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto max-w-3xl px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Cấu hình hệ thống</h1>
				<section className="mt-4 card p-4">
					<h2 className="text-lg font-semibold text-gray-800">Điều hướng nhanh</h2>
					<div className="mt-3 flex flex-wrap gap-3">
						<Link href="/customer" className="btn btn-primary">Trang người dùng</Link>
						<Link href="/restaurant" className="btn btn-outline">Trang nhà hàng</Link>
						<Link href="/driver" className="btn btn-outline">Trang tài xế</Link>
					</div>
				</section>
				<div className="mt-6 space-y-6">
					<section className="card p-6">
						<h2 className="text-lg font-semibold text-gray-800">Phân quyền</h2>
						<p className="mt-2 text-sm text-gray-600">Quy định quyền theo role (placeholder)</p>
						<div className="mt-3 flex flex-wrap gap-2">
							<span className="rounded-full border px-3 py-1 text-sm">admin</span>
							<span className="rounded-full border px-3 py-1 text-sm">restaurant</span>
							<span className="rounded-full border px-3 py-1 text-sm">driver</span>
							<span className="rounded-full border px-3 py-1 text-sm">user</span>
						</div>
					</section>

					<section className="card p-6">
						<h2 className="text-lg font-semibold text-gray-800">Cấu hình vận hành</h2>
						<div className="mt-3 flex items-center gap-3">
							<input id="freepick" type="checkbox" checked={freepick} onChange={(e)=>setFreepick(e.target.checked)} />
							<label htmlFor="freepick" className="text-sm text-gray-700">Bật chế độ Freepick cho tài xế</label>
						</div>
					</section>

					<section className="card p-6">
						<h2 className="text-lg font-semibold text-gray-800">Thanh toán</h2>
						<p className="mt-2 text-sm text-gray-600">Cổng ví điện tử, COD, thẻ (placeholder)</p>
					</section>

					<section className="card p-6">
						<h2 className="text-lg font-semibold text-gray-800">Thông báo hệ thống</h2>
						<p className="mt-2 text-sm text-gray-600">Push, email (placeholder)</p>
					</section>
				</div>
			</div>
		</main>
	);
}
