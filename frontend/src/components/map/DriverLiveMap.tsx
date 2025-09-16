"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { L?: any }
}

export default function DriverLiveMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletReadyRef = useRef(false);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const [error, setError] = useState<string>("");
  const [geoState, setGeoState] = useState<"unknown"|"granted"|"denied">("unknown");

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


