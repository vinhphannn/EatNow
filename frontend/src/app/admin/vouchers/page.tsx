"use client";
import { useState } from "react";

type Voucher = { id: string; code: string; discount: number; scope: string; active: boolean };

export default function AdminVouchersPage() {
	const [list, setList] = useState<Voucher[]>([
		{ id: "1", code: "FREESHIP", discount: 10000, scope: "toàn hệ thống", active: true },
		{ id: "2", code: "SALE30", discount: 30, scope: "% toàn hệ thống", active: false },
	]);
	const [code, setCode] = useState("");
	const [discount, setDiscount] = useState<number>(0);

	function addVoucher(e: React.FormEvent) {
		e.preventDefault();
		if (!code) return;
		setList((s) => [{ id: crypto.randomUUID(), code, discount, scope: "toàn hệ thống", active: true }, ...s]);
		setCode("");
		setDiscount(0);
	}

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-gray-900">Khuyến mãi / Voucher</h1>
				<form onSubmit={addVoucher} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
					<div>
						<label className="block text-sm text-gray-600">Mã</label>
						<input value={code} onChange={(e)=>setCode(e.target.value)} className="mt-1 rounded-md border px-3 py-2" placeholder="SALE10" />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Giảm</label>
						<input value={discount} onChange={(e)=>setDiscount(Number(e.target.value)||0)} type="number" className="mt-1 w-28 rounded-md border px-3 py-2" placeholder="10" />
					</div>
					<button className="btn-primary">Thêm</button>
				</form>
				<div className="mt-6 overflow-x-auto rounded-xl border bg-white">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-left text-gray-600">
							<tr>
								<th className="px-4 py-3">Mã</th>
								<th className="px-4 py-3">Giảm</th>
								<th className="px-4 py-3">Phạm vi</th>
								<th className="px-4 py-3">Trạng thái</th>
								<th className="px-4 py-3">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{list.map((v)=> (
								<tr key={v.id} className="border-t">
									<td className="px-4 py-3 font-medium">{v.code}</td>
									<td className="px-4 py-3">{v.discount}{v.scope.includes("%") ? '%' : ' đ'}</td>
									<td className="px-4 py-3">{v.scope}</td>
									<td className="px-4 py-3">{v.active ? 'Bật' : 'Tắt'}</td>
									<td className="px-4 py-3">
										<button onClick={()=>setList((s)=> s.map(x=> x.id===v.id? {...x, active: !x.active }: x))} className="rounded-md border px-3 py-1.5 hover:bg-gray-50">{v.active ? 'Tắt' : 'Bật'}</button>
										<button onClick={()=>setList((s)=> s.filter(x=>x.id!==v.id))} className="ml-2 rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700">Xóa</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</main>
	);
}
