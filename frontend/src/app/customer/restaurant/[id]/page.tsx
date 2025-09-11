// Trang server component, không import store phía client trực tiếp ở đây

// Trang chi tiết nhà hàng: hiển thị menu và thêm vào giỏ hàng
export default async function RestaurantDetail({ params }: { params: { id: string } }) {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const id = params.id;
  // Tận dụng API demo/restaurants, lọc theo id (demo)
  const res = await fetch(`${api}/demo/restaurants`, { cache: 'no-store' });
  const list = res.ok ? await res.json() : [];
  const r = list.find((x: any) => x.restaurant_id === id);

  if (!r) {
    return (
      <main className="min-h-screen container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Không tìm thấy nhà hàng</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">{r.restaurant_name}</h1>
        <p className="text-gray-600 mt-2">Chọn món và thêm vào giỏ</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {r.items.map((it: any) => (
            <form key={it.id} action={async () => {
              "use server";
              // server action để thêm vào giỏ không dùng được; demo dùng client route
            }} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-lg font-semibold text-gray-800">{it.name}</div>
              <div className="text-orange-600 font-bold mt-1">{new Intl.NumberFormat('vi-VN').format(it.price)} đ</div>
              <a href={`/customer/cart?add=${it.id}&name=${encodeURIComponent(it.name)}&price=${it.price}&rid=${id}`} className="mt-4 inline-block rounded-md bg-orange-600 px-3 py-2 text-white hover:bg-orange-700">Thêm vào giỏ</a>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}


