"use client";
import { useState } from "react";

export default function DriverProfilePage() {
	const [name, setName] = useState("Tài xế Demo");
	const [phone, setPhone] = useState("090xxxxxxx");
	const [idCard, setIdCard] = useState("0790xxxxxx");
	const [active, setActive] = useState(true);
	const [message, setMessage] = useState<string | null>(null);

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setMessage("Đã lưu (demo)");
	}

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
				<form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
					<div>
						<label className="block text-sm text-gray-600">Họ và tên</label>
						<input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Số điện thoại</label>
						<input value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
					</div>
					<div>
						<label className="block text-sm text-gray-600">CMND/CCCD</label>
						<input value={idCard} onChange={(e)=>setIdCard(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
					</div>
					<div className="flex items-center gap-2">
						<input id="active" type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)} />
						<label htmlFor="active" className="text-sm text-gray-700">Đang hoạt động</label>
					</div>
					<div className="flex items-center gap-3">
						<button className="btn-primary">Lưu</button>
						<button type="button" className="rounded-md border px-4 py-2 hover:bg-gray-50">Đổi mật khẩu</button>
					</div>
					{message && <div className="text-sm text-green-700">{message}</div>}
				</form>
			</div>
		</main>
	);
}
