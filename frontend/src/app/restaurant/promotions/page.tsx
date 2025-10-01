"use client";
import { useState } from "react";

type Voucher = { id: string; code: string; type: 'percent'|'amount'; value: number; expiresAt: string };

export default function RestaurantPromotionsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([
    { id: '1', code: 'SALE10', type: 'percent', value: 10, expiresAt: new Date(Date.now()+86400000).toISOString() },
  ]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Voucher>({ id: '', code: '', type: 'percent', value: 10, expiresAt: new Date().toISOString() });
  function add() {
    if (!form.code) return;
    setVouchers(prev=> [{ ...form, id: Math.random().toString(36).slice(2) }, ...prev]);
    setOpen(false);
  }
  function remove(id: string) { setVouchers(prev=>prev.filter(v=>v.id!==id)); }
  const isExpired = (v: Voucher)=> new Date(v.expiresAt).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Khuyến mãi</h1>
        <button onClick={()=>{setForm({ id:'', code:'', type:'percent', value:10, expiresAt: new Date().toISOString() }); setOpen(true);}} className="btn-primary">Thêm mã</button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-gray-500">
              <th className="py-2 px-3">Mã</th>
              <th className="py-2 px-3">Loại</th>
              <th className="py-2 px-3">Giá trị</th>
              <th className="py-2 px-3">Hết hạn</th>
              <th className="py-2 px-3">Trạng thái</th>
              <th className="py-2 px-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(v=> (
              <tr key={v.id} className="border-t">
                <td className="py-2 px-3">{v.code}</td>
                <td className="py-2 px-3">{v.type}</td>
                <td className="py-2 px-3">{v.type==='percent'? v.value+'%' : new Intl.NumberFormat('vi-VN').format(v.value)+' đ'}</td>
                <td className="py-2 px-3">{new Date(v.expiresAt).toLocaleDateString('vi-VN')}</td>
                <td className="py-2 px-3">{isExpired(v)? <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Hết hạn</span> : <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Còn hạn</span>}</td>
                <td className="py-2 px-3"><button onClick={()=>remove(v.id)} className="rounded border px-3 py-1 text-sm text-red-700 hover:bg-red-50">Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Thêm mã giảm giá</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Mã</label>
                <input value={form.code} onChange={(e)=>setForm({...form, code: e.target.value})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div>
                <label className="text-sm text-gray-600">Loại</label>
                <select value={form.type} onChange={(e)=>setForm({...form, type: e.target.value as any})} className="mt-1 w-full rounded-md border px-3 py-2">
                  <option value="percent">Phần trăm</option>
                  <option value="amount">Số tiền</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Giá trị</label>
                <input type="number" value={form.value} onChange={(e)=>setForm({...form, value: Number(e.target.value)})} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Hết hạn</label>
                <input type="date" onChange={(e)=>{
                  const d = new Date(e.target.value);
                  setForm({...form, expiresAt: d.toISOString()});
                }} className="mt-1 w-full rounded-md border px-3 py-2"/>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={()=>setOpen(false)} className="rounded border px-4 py-2 hover:bg-gray-50">Hủy</button>
              <button onClick={add} className="btn-primary">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


