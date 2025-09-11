// Trang Nhà hàng: xem nhanh menu hiện có (demo), sau sẽ thêm CRUD
export default async function RestaurantPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  let restaurants: Array<{ restaurant_id: string; restaurant_name: string; items: any[] }>=[];
  try {
    const res = await fetch(`${api}/demo/restaurants`, { cache: 'no-store' });
    restaurants = res.ok ? await res.json() : [];
  } catch {
    restaurants = [];
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Cổng nhà hàng</h1>
        <p className="text-gray-600 mt-2">Quản lý menu, cập nhật trạng thái</p>

        {restaurants.map((r) => (
          <div key={r.restaurant_id} className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">{r.restaurant_name}</h2>
            <table className="mt-4 w-full text-left">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="py-2">Món</th>
                  <th className="py-2">Giá</th>
                </tr>
              </thead>
              <tbody>
                {r.items.map((it:any) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2 text-gray-800">{it.name}</td>
                    <td className="py-2 font-medium text-orange-600">{new Intl.NumberFormat('vi-VN').format(it.price)} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {restaurants.length === 0 && (
          <div className="mt-8 rounded-xl border bg-white p-6 text-gray-600">
            Chưa có dữ liệu. Vào trang Admin để bấm nút "Seed dữ liệu mẫu".
          </div>
        )}
      </div>
    </main>
  );
}



