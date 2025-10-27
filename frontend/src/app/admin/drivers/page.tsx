"use client";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faStar,
  faTruck,
  faClock,
  faDollarSign,
  faBan,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faEye,
  faEdit,
  faTrash,
  faUser,
  faPhone,
  faEnvelope,
  faCar,
  faCreditCard,
  faChartLine,
  faRoad,
  faWallet,
  faCog
} from '@fortawesome/free-solid-svg-icons';

interface DriverData {
  // Thông tin cơ bản
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  
  // Trạng thái làm việc
  status: string;
  deliveryStatus?: string | null;
  
  // Thông tin ban
  banInfo?: {
    reason: string;
    until?: string;
    bannedBy: string;
    bannedAt: string;
  } | null;
  
  // Vị trí GPS
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  lastLocationAt?: string;
  
  // Đơn hàng hiện tại
  currentOrderId?: string | null;
  currentOrderStartedAt?: string;
  
  // Chỉ số hiệu suất
  ordersCompleted: number;
  ordersRejected: number;
  ordersSkipped: number;
  rating: number;
  ratingCount: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  
  // Thông tin phương tiện
  vehicleType?: string;
  licensePlate?: string;
  
  // Thông tin ngân hàng
  bankAccount?: string;
  bankName?: string;
  
  // Thống kê chi tiết
  totalDeliveries: number;
  averageDeliveryTime: number;
  performanceScore: number;
  
  // Theo dõi tải công việc
  activeOrdersCount: number;
  maxConcurrentOrders: number;
  
  // Hiệu suất khoảng cách
  averageDistancePerOrder: number;
  totalDistanceTraveled: number;
  
  // Chế độ tự động
  isAuto: boolean;
  autoMeta?: any;
  
  // Ví tiền
  walletBalance: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export default function AdminDriversPage() {
    const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";

    const [q, setQ] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [sort, setSort] = useState<string>("createdAt:desc");
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);

    const [data, setData] = useState<DriverData[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [stats, setStats] = useState<any>(null);

    const query = useMemo(() => {
        const p = new URLSearchParams();
        p.set('page', String(page));
        p.set('limit', String(limit));
        if (q) p.set('q', q);
        if (status) p.set('status', status);
        if (sort) p.set('sort', sort);
        return p.toString();
    }, [page, limit, q, status, sort]);

    // Load stats
    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await fetch(`${api}/admin/drivers/stats/overview`, { credentials: 'include' });
                if (res.ok) {
                    const json = await res.json();
                    setStats(json.data);
                }
            } catch (e) {
                console.error('Failed to load stats:', e);
            }
        };
        loadStats();
    }, [api]);

    useEffect(() => {
        const ctrl = new AbortController();
        (async () => {
            setLoading(true); setError(null);
            try {
                const res = await fetch(`${api}/admin/drivers?${query}`, { credentials: 'include', signal: ctrl.signal, cache: 'no-store' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setData(Array.isArray(json?.data) ? json.data : []);
                setTotal(Number(json?.meta?.total ?? json?.total ?? 0));
            } catch (e: any) {
                if (e?.name === 'AbortError') return;
                setError(e?.message || 'Tải dữ liệu thất bại');
                setData([]); setTotal(0);
            } finally { setLoading(false); }
        })();
        return () => ctrl.abort();
    }, [api, query]);

    const toggleAuto = async (id: string, enable: boolean) => {
        try {
            await fetch(`${api}/admin/drivers/${id}/auto`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enable })
            });
            // refresh current page
            const p = new URLSearchParams();
            p.set('page', String(page));
            p.set('limit', String(limit));
            if (q) p.set('q', q);
            if (status) p.set('status', status);
            if (sort) p.set('sort', sort);
            const res = await fetch(`${api}/admin/drivers?${p.toString()}`, { credentials: 'include', cache: 'no-store' });
            const json = await res.json();
            setData(Array.isArray(json?.data) ? json.data : []);
            setTotal(Number(json?.meta?.total ?? json?.total ?? 0));
        } catch {}
    };

    const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'checkin': return 'bg-green-100 text-green-800';
            case 'checkout': return 'bg-yellow-100 text-yellow-800';
            case 'ban': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDeliveryStatusColor = (status: string | null) => {
        switch (status) {
            case 'delivering': return 'bg-blue-100 text-blue-800';
            case null: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Tài xế</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FontAwesomeIcon icon={faEye} className="mr-2" />
                            {showDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết'}
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faUser} className="text-blue-600 text-2xl mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Tổng tài xế</p>
                                    <p className="text-2xl font-bold">{stats.performance?.totalDrivers || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faStar} className="text-yellow-600 text-2xl mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Đánh giá TB</p>
                                    <p className="text-2xl font-bold">{(stats.performance?.avgRating || 0).toFixed(1)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faTruck} className="text-green-600 text-2xl mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Đơn hoàn thành TB</p>
                                    <p className="text-2xl font-bold">{(stats.performance?.avgOrdersCompleted || 0).toFixed(0)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faDollarSign} className="text-purple-600 text-2xl mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Tổng ví tiền</p>
                                    <p className="text-2xl font-bold">{(stats.performance?.totalWalletBalance || 0).toLocaleString()}₫</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input 
                                    value={q} 
                                    onChange={(e) => { setPage(1); setQ(e.target.value); }} 
                                    placeholder="Tìm theo tên / SĐT / email" 
                                    className="w-64 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
                                />
                                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
                            </div>
                            <select 
                                value={status} 
                                onChange={(e) => { setPage(1); setStatus(e.target.value); }} 
                                className="rounded-lg border px-3 py-2 text-sm"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="checkin">Checkin</option>
                                <option value="checkout">Checkout</option>
                                <option value="ban">Bị cấm</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setSort(s => s === 'createdAt:desc' ? 'createdAt:asc' : 'createdAt:desc')} 
                                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                                Sắp xếp: {sort.endsWith('desc') ? 'Mới nhất' : 'Cũ nhất'}
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                {/* Drivers Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">Thông tin cơ bản</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Hiệu suất</th>
                                    {showDetails && <th className="px-4 py-3">Vị trí & Phương tiện</th>}
                                    {showDetails && <th className="px-4 py-3">Tài chính</th>}
                                    <th className="px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={showDetails ? 6 : 4} className="px-4 py-8 text-center text-gray-400">
                                            <FontAwesomeIcon icon={faClock} className="animate-spin mr-2" />
                                            Đang tải...
                                        </td>
                                    </tr>
                                )}
                                {!loading && data.map((driver) => (
                                    <tr key={driver.id} className="border-t hover:bg-gray-50">
                                        {/* Thông tin cơ bản */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                    <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{driver.name}</p>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        {driver.phone && (
                                                            <span className="flex items-center mr-3">
                                                                <FontAwesomeIcon icon={faPhone} className="mr-1" />
                                                                {driver.phone}
                                                            </span>
                                                        )}
                                                        {driver.email && (
                                                            <span className="flex items-center">
                                                                <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
                                                                {driver.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        Tạo: {new Date(driver.createdAt).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Trạng thái */}
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                                                    {driver.status === 'checkin' ? 'Đang làm việc' : 
                                                     driver.status === 'checkout' ? 'Tạm nghỉ' : 
                                                     driver.status === 'ban' ? 'Bị cấm' : driver.status}
                                                </span>
                                                <div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(driver.deliveryStatus)}`}>
                                                        {driver.deliveryStatus === 'delivering' ? 'Đang giao hàng' : 'Sẵn sàng'}
                                                    </span>
                                                </div>
                                                {driver.banInfo && (
                                                    <div className="text-xs text-red-600">
                                                        <FontAwesomeIcon icon={faBan} className="mr-1" />
                                                        {driver.banInfo.reason}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Hiệu suất */}
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faStar} className="text-yellow-500 mr-1" />
                                                    <span className="font-medium">{driver.rating.toFixed(1)}</span>
                                                    <span className="text-xs text-gray-500 ml-1">({driver.ratingCount})</span>
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    <div>Hoàn thành: {driver.ordersCompleted}</div>
                                                    <div>Từ chối: {driver.ordersRejected}</div>
                                                    <div>Đúng giờ: {driver.onTimeDeliveries}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Chi tiết - Vị trí & Phương tiện */}
                                        {showDetails && (
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    {driver.location && (
                                                        <div className="flex items-center text-xs text-gray-600">
                                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                                                            {driver.location.latitude.toFixed(4)}, {driver.location.longitude.toFixed(4)}
                                                        </div>
                                                    )}
                                                    {driver.vehicleType && (
                                                        <div className="flex items-center text-xs text-gray-600">
                                                            <FontAwesomeIcon icon={faCar} className="mr-1" />
                                                            {driver.vehicleType}
                                                        </div>
                                                    )}
                                                    {driver.licensePlate && (
                                                        <div className="text-xs text-gray-600">
                                                            {driver.licensePlate}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        Quãng đường: {driver.totalDistanceTraveled.toFixed(1)}km
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* Chi tiết - Tài chính */}
                                        {showDetails && (
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm font-medium">
                                                        <FontAwesomeIcon icon={faWallet} className="text-green-600 mr-1" />
                                                        {driver.walletBalance.toLocaleString()}₫
                                                    </div>
                                                    {driver.bankAccount && (
                                                        <div className="text-xs text-gray-600">
                                                            <FontAwesomeIcon icon={faCreditCard} className="mr-1" />
                                                            {driver.bankName} - {driver.bankAccount}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        Hiệu suất: {driver.performanceScore.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* Thao tác */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDriver(driver);
                                                        setShowDetails(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Xem chi tiết"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <label className="inline-flex cursor-pointer items-center gap-1">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!driver.isAuto} 
                                                        onChange={(e) => toggleAuto(driver.id, e.target.checked)} 
                                                        className="rounded"
                                                    />
                                                    <span className="text-xs text-gray-600">Auto</span>
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && data.length === 0 && (
                                    <tr>
                                        <td colSpan={showDetails ? 6 : 4} className="px-4 py-8 text-center text-gray-500">
                                            Chưa có dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Trang {page} / {totalPages} • Tổng {total} tài xế
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page <= 1} 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                            Trước
                        </button>
                        <button 
                            disabled={page >= totalPages} 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                            Sau
                        </button>
                        <select 
                            value={limit} 
                            onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }} 
                            className="rounded-lg border px-2 py-1 text-sm"
                        >
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
