"use client";

type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  phone?: string;
  isDefault?: boolean;
};

export default function AddressPage() {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('eatnow_addresses') : null;
  const addrs: Address[] = stored ? JSON.parse(stored) : [];

  function save(addrs: Address[]) {
    if (typeof window !== 'undefined') localStorage.setItem('eatnow_addresses', JSON.stringify(addrs));
  }

  function onSubmit(formData: FormData) {
    const a: Address = {
      id: crypto.randomUUID(),
      label: String(formData.get('label') || ''),
      line1: String(formData.get('line1') || ''),
      city: String(formData.get('city') || ''),
      phone: String(formData.get('phone') || ''),
      isDefault: !!formData.get('isDefault')
    };
    const next = a.isDefault ? addrs.map(x=>({ ...x, isDefault: false })) : addrs.slice();
    next.unshift(a);
    save(next);
    location.reload();
  }

  function remove(id: string) {
    const next = addrs.filter(a=>a.id!==id);
    save(next);
    location.reload();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Sổ địa chỉ (demo)</h1>

        <form action={onSubmit} className="mt-6 card p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="label" placeholder="Nhãn (Nhà/VP)" className="rounded-lg border px-3 py-2" required />
            <input name="phone" placeholder="SĐT" className="rounded-lg border px-3 py-2" />
            <input name="line1" placeholder="Địa chỉ" className="rounded-lg border px-3 py-2 sm:col-span-2" required />
            <input name="city" placeholder="Thành phố" className="rounded-lg border px-3 py-2 sm:col-span-2" required />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" name="isDefault" /> Đặt làm mặc định</label>
          <button className="btn-primary">Lưu địa chỉ</button>
        </form>

        <div className="mt-6 card p-6">
          {addrs.length === 0 ? (
            <div className="text-gray-600">Chưa có địa chỉ.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {addrs.map(a => (
                <div key={a.id} className="rounded-xl border p-4">
                  <div className="font-semibold text-gray-800">{a.label} {a.isDefault && <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Mặc định</span>}</div>
                  <div className="text-sm text-gray-600">{a.line1}</div>
                  <div className="text-sm text-gray-600">{a.city}</div>
                  <div className="text-sm text-gray-600">{a.phone}</div>
                  <button onClick={()=>remove(a.id)} className="mt-2 text-red-600 hover:underline">Xóa</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


