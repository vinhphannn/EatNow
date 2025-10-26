"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { L?: any }
}

interface AvailableOrder {
  id: string;
  orderCode?: string;
  restaurantId: string;
  status: string;
  total: number;
  deliveryFee: number;
  tip?: number;
  createdAt: string;
  restaurantName?: string;
  restaurantAddress?: string;
  customerAddress?: string;
  customerName?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  customerLat?: number;
  customerLng?: number;
}

export default function DriverLiveMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletReadyRef = useRef(false);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const orderMarkersRef = useRef<any[]>([]);
  const [error, setError] = useState<string>("");
  const [geoState, setGeoState] = useState<"unknown"|"granted"|"denied">("unknown");
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AvailableOrder | null>(null);

  // Load available orders
  const loadAvailableOrders = async () => {
    setLoadingOrders(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${api}/api/v1/orders/available`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const orders = await response.json();
        setAvailableOrders(Array.isArray(orders) ? orders : []);
      } else {
        console.error('Failed to load available orders');
        setAvailableOrders([]);
      }
    } catch (error) {
      console.error('Error loading available orders:', error);
      setAvailableOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Accept order function
  const acceptOrder = async (orderId: string) => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${api}/api/v1/orders/${orderId}/accept-available`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        // Reload orders after accepting
        await loadAvailableOrders();
        setSelectedOrder(null);
        
        // Show success message and redirect to current orders
        alert('Đã nhận đơn thành công! Chuyển đến trang đơn hàng hiện tại...');
        
        // Redirect to driver current orders page
        setTimeout(() => {
          window.location.href = '/driver/current';
        }, 1500);
      } else {
        const error = await response.json();
        alert(`Không thể nhận đơn: ${error.message || 'Có lỗi xảy ra'}`);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Không thể nhận đơn. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    // Inject Leaflet CSS/JS from CDN if not present
    const ensureLeaflet = async () => {
      if (leafletReadyRef.current) return;
      const hasCss = !!document.querySelector('link[href*="leaflet.css"]');
      const hasJs = !!document.querySelector('script[src*="leaflet.js"]');
      if (!hasCss) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 50));
      if (!hasJs) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }
      leafletReadyRef.current = true;
    };

    const initMap = async () => {
      try {
        await ensureLeaflet();
        if (!mapRef.current || !window.L) return;
        const L = window.L;
        const initial = [10.776889, 106.700806]; // default: HCMC center
        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView(initial, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        const marker = L.marker(initial).addTo(map);
        const accuracy = L.circle(initial, { radius: 0, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.15 }).addTo(map);
        mapInstanceRef.current = map;
        markerRef.current = marker;
        accuracyRef.current = accuracy;

        // Load available orders after map is ready
        loadAvailableOrders();

        if ('geolocation' in navigator) {
          try {
            // Track permission (not supported on all browsers)
            const perm: any = (navigator as any).permissions;
            if (perm?.query) {
              perm.query({ name: 'geolocation' as any }).then((status: any) => {
                setGeoState(status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'unknown');
                status.onchange = () => setGeoState(status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'unknown');
              }).catch(()=>{});
            }
          } catch {}
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const { latitude, longitude, accuracy: acc } = pos.coords;
              const latlng = [latitude, longitude];
              marker.setLatLng(latlng);
              accuracy.setLatLng(latlng);
              accuracy.setRadius(acc || 0);
              map.setView(latlng, map.getZoom() < 15 ? 15 : map.getZoom());
              setGeoState('granted');
            },
            (err) => {
              setError(err.message || 'Không thể lấy vị trí GPS');
              // If user blocked
              if (err.code === 1) setGeoState('denied');
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
          );
        } else {
          setError('Trình duyệt không hỗ trợ định vị');
        }
      } catch (e: any) {
        setError(e?.message || 'Không thể khởi tạo bản đồ');
      }
    };

    initMap();
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      try { mapInstanceRef.current && mapInstanceRef.current.remove(); } catch {}
    };
  }, []);

  // Update order markers when availableOrders change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    
    const map = mapInstanceRef.current;
    const L = window.L;
    
    // Clear existing order markers
    orderMarkersRef.current.forEach(marker => map.removeLayer(marker));
    orderMarkersRef.current = [];
    
    // Add new order markers
    availableOrders.forEach(order => {
      // Use restaurant location as marker position (fallback to HCMC center)
      const lat = order.restaurantLat || 10.776889;
      const lng = order.restaurantLng || 106.700806;
      
      // Create custom icon for order markers
      const orderIcon = L.divIcon({
        className: 'order-marker',
        html: `
          <div style="
            background: #f97316;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ₫
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      const marker = L.marker([lat, lng], { icon: orderIcon }).addTo(map);
      
      // Add click handler
      marker.on('click', () => {
        setSelectedOrder(order);
      });
      
      // Add popup with order info
      const createPopupContent = () => `
        <div style="min-width: 220px; padding: 4px;">
          <div style="font-weight: bold; margin-bottom: 6px; color: #f97316;">ID: ${order.orderCode || '#' + order.id.slice(-6)}</div>
          <div style="margin-bottom: 4px; font-size: 13px;">💰 Tổng tiền: ₫${order.total.toLocaleString('vi-VN')}</div>
          <div style="margin-bottom: 4px; font-size: 13px;">🚚 Phí ship: ₫${order.deliveryFee.toLocaleString('vi-VN')}</div>
          ${order.tip > 0 ? `<div style="margin-bottom: 4px; font-size: 13px;">💵 Tip: ₫${order.tip.toLocaleString('vi-VN')}</div>` : ''}
          <div style="margin-bottom: 4px; font-size: 13px;">📅 ${new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          ${order.restaurantName ? `<div style="margin-bottom: 6px; font-size: 13px; color: #059669;">🏪 ${order.restaurantName}</div>` : ''}
          <button onclick="window.acceptOrder('${order.id}')" style="
            background: #f97316;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            width: 100%;
            font-weight: 600;
          ">Nhận đơn</button>
        </div>
      `;
      
      marker.bindPopup(createPopupContent());
      orderMarkersRef.current.push(marker);
    });
  }, [availableOrders]);

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadAvailableOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Make acceptOrder available globally for popup buttons
  useEffect(() => {
    (window as any).acceptOrder = acceptOrder;
    return () => {
      delete (window as any).acceptOrder;
    };
  }, []);

  const requestPermission = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      () => setGeoState('granted'),
      (e) => { setError(e.message || 'Không thể lấy vị trí'); setGeoState('denied'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative w-full h-[420px]">
      <div ref={mapRef} className="absolute inset-0 rounded-xl" />
      
      {/* Order info panel */}
      <div className="absolute top-2 left-2 right-2 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-800">
              Đơn hàng có sẵn: {availableOrders.length}
            </div>
            {loadingOrders && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            )}
          </div>
          <button 
            onClick={loadAvailableOrders}
            disabled={loadingOrders}
            className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 disabled:opacity-50"
          >
            🔄 Làm mới
          </button>
        </div>
        {availableOrders.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            💡 Nhấp vào biểu tượng ₫ trên bản đồ để xem chi tiết và nhận đơn
          </div>
        )}
      </div>

      {/* Selected order modal */}
      {selectedOrder && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[2000]">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-800">Chi tiết đơn hàng</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="text-base font-bold text-orange-600">ID: {selectedOrder.orderCode || '#' + selectedOrder.id.slice(-6)}</div>
              <div><strong>Tổng tiền:</strong> ₫{selectedOrder.total.toLocaleString('vi-VN')}</div>
              <div><strong>Phí ship:</strong> ₫{selectedOrder.deliveryFee.toLocaleString('vi-VN')}</div>
              {selectedOrder.tip > 0 && (
                <div><strong>Tip:</strong> ₫{selectedOrder.tip.toLocaleString('vi-VN')}</div>
              )}
              <div><strong>Thời gian:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
              {selectedOrder.restaurantName && (
                <div><strong>Nhà hàng:</strong> {selectedOrder.restaurantName}</div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button 
                onClick={() => acceptOrder(selectedOrder.id)}
                className="flex-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Nhận đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {(geoState !== 'granted') && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
          <div className="rounded-lg border bg-white p-4 text-center shadow">
            <div className="text-gray-800 font-medium">Cho phép sử dụng vị trí để hiển thị bản đồ realtime</div>
            <div className="mt-2 text-sm text-gray-600">Nhấn nút bên dưới để cấp quyền. Nếu đã từ chối, hãy vào Cài đặt trình duyệt và bật lại quyền vị trí cho trang.</div>
            <button onClick={requestPermission} className="mt-3 rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">Cấp quyền vị trí</button>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute bottom-2 left-2 right-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 shadow">
          {error}
        </div>
      )}
    </div>
  );
}


