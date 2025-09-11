"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Trang đăng ký tài khoản khách hàng
export default function RegisterPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // Gọi endpoint đơn giản: POST /users/register
      const res = await fetch(`${api}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone }),
      });
      if (res.ok) {
        setMessage("Đăng ký thành công! Đang chuyển tới trang đăng nhập...");
        setEmail(""); setPassword(""); setName(""); setPhone("");
        // Chuyển tới trang đăng nhập
        setTimeout(() => router.push("/customer/login"), 2000);
      } else {
        // Cố gắng đọc lỗi JSON chuẩn NestJS: { statusCode, message, error }
        let errText = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          if (Array.isArray(data?.message)) {
            errText = data.message.join(", ");
          } else if (typeof data?.message === "string") {
            errText = data.message;
          } else if (typeof data?.error === "string") {
            errText = data.error;
          }
        } catch {
          try { errText = await res.text(); } catch {}
        }
        setMessage(`Lỗi đăng ký: ${errText}`);
      }
    } catch (err: any) {
      setMessage("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-xl px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Đăng ký tài khoản</h1>
        <p className="text-gray-600 mt-2">Tạo tài khoản khách hàng để đặt món</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 bg-white rounded-xl border p-6 shadow-sm">
          <div>
            <label className="block text-sm text-gray-600">Họ và tên</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Nguyễn Văn A" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="ban@vidu.com" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Số điện thoại</label>
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="0901xxxxxx" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Mật khẩu</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="••••••••" required />
          </div>
          <button disabled={loading} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
          {message && <div className="text-sm text-gray-700">{message}</div>}
        </form>
      </div>
    </main>
  );
}
