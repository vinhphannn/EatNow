"use client";

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components';
import { useDistanceCalculator } from '@/hooks/useDistanceCalculator';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export default function TestDistancePage() {
  const { showToast } = useToast();
  const { 
    calculateDistance, 
    getAddressFromCoords, 
    calculateDeliveryFee, 
    estimateDeliveryTime,
    loading: distanceLoading 
  } = useDistanceCalculator();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [selectingLocation, setSelectingLocation] = useState<'start' | 'end' | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  
  const [startLocation, setStartLocation] = useState<Location>({
    lat: 10.8231,
    lng: 106.6297
  });
  
  const [endLocation, setEndLocation] = useState<Location>({
    lat: 10.7769,
    lng: 106.7009
  });

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => {
            createMap();
          };
          document.head.appendChild(script);
        } else {
          createMap();
        }
      } catch (error) {
        console.error('Error loading Leaflet:', error);
        showToast('Lỗi khi tải bản đồ', 'error');
      }
    };

    const createMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      const newMap = L.map(mapRef.current).setView([10.8231, 106.6297], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap);

      setMap(newMap);
    };

    initMap();
  }, []);

  // Add click event handler when map is ready and selectingLocation changes
  useEffect(() => {
    if (!map) return;

    const handleMapClickEvent = (e: any) => {
      console.log('🗺️ Map clicked!', { selectingLocation, lat: e.latlng.lat, lng: e.latlng.lng });
      if (selectingLocation) {
        const { lat, lng } = e.latlng;
        handleMapClick(lat, lng);
      } else {
        console.log('🗺️ No location selection active');
      }
    };

    // Remove existing click handler
    map.off('click');
    // Add new click handler
    map.on('click', handleMapClickEvent);

    // Cleanup
    return () => {
      map.off('click', handleMapClickEvent);
    };
  }, [map, selectingLocation]);

  // Update markers when locations change
  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [map, startLocation, endLocation]);

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    console.log('🗺️ handleMapClick called', { selectingLocation, lat, lng });
    if (!selectingLocation) {
      console.log('🗺️ No selectingLocation, returning');
      return;
    }
    
    console.log('🗺️ Getting address from coordinates...');
    const address = await getAddressFromCoords(lat, lng);
    console.log('🗺️ Address:', address);
    
    if (selectingLocation === 'start') {
      console.log('🗺️ Setting start location');
      setStartLocation({ lat, lng, address });
      showToast('Đã chọn điểm bắt đầu', 'success');
    } else if (selectingLocation === 'end') {
      console.log('🗺️ Setting end location');
      setEndLocation({ lat, lng, address });
      showToast('Đã chọn điểm kết thúc', 'success');
    }
    
    console.log('🗺️ Clearing selectingLocation');
    setSelectingLocation(null);
    updateMarkers();
  };

  // Update markers on map
  const updateMarkers = () => {
    if (!map) return;
    
    const L = (window as any).L;
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    const newMarkers: any[] = [];
    
    // Add start marker
    if (startLocation.lat && startLocation.lng) {
      const startMarker = L.marker([startLocation.lat, startLocation.lng], {
        icon: L.divIcon({
          className: 'custom-marker start-marker',
          html: '<div style="background: #10b981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">A</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map);
      
      startMarker.bindPopup(`
        <div>
          <strong>Điểm bắt đầu</strong><br>
          ${startLocation.address || `${startLocation.lat.toFixed(6)}, ${startLocation.lng.toFixed(6)}`}
        </div>
      `);
      
      newMarkers.push(startMarker);
    }
    
    // Add end marker
    if (endLocation.lat && endLocation.lng) {
      const endMarker = L.marker([endLocation.lat, endLocation.lng], {
        icon: L.divIcon({
          className: 'custom-marker end-marker',
          html: '<div style="background: #ef4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">B</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map);
      
      endMarker.bindPopup(`
        <div>
          <strong>Điểm kết thúc</strong><br>
          ${endLocation.address || `${endLocation.lat.toFixed(6)}, ${endLocation.lng.toFixed(6)}`}
        </div>
      `);
      
      newMarkers.push(endMarker);
    }
    
    setMarkers(newMarkers);
  };


  // Get route using the distance calculator hook
  const getRoute = async () => {
    if (!map) return;
    
    try {
      const result = await calculateDistance(startLocation, endLocation);
      
      if (result.success) {
        setDistance(result.distance);
        setDuration(result.duration);
        
        // Clear existing route
        if (route) {
          map.removeLayer(route);
        }
        
        const L = (window as any).L;
        
        if (result.route && result.route.length > 0) {
          // Draw actual route
          const polyline = L.polyline(result.route, {
            color: 'red',
            weight: 4,
            opacity: 0.8
          }).addTo(map);
          
          setRoute(polyline);
          
          // Fit map to route
          map.fitBounds(polyline.getBounds());
          
          showToast('Đã tìm đường thành công!', 'success');
        } else {
          showToast('Không tìm thấy đường đi', 'error');
        }
      } else {
        showToast('Không thể tính khoảng cách', 'error');
      }
    } catch (error) {
      console.error('Route error:', error);
      showToast('Lỗi khi tính khoảng cách', 'error');
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await getAddressFromCoords(lat, lng);
          
          setStartLocation({ lat, lng, address });
          showToast('Đã lấy vị trí hiện tại', 'success');
        },
        (error) => {
          console.error('Geolocation error:', error);
          showToast('Không thể lấy vị trí hiện tại', 'error');
        }
      );
    } else {
      showToast('Trình duyệt không hỗ trợ định vị', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Khoảng Cách & Dẫn Đường</h1>
        
        {/* Instructions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">📋 Hướng dẫn sử dụng:</h2>
          <div className="text-sm text-blue-800 space-y-1">
            <p>1. <strong>Chọn điểm bắt đầu:</strong> Nhấn "Chọn trên bản đồ" rồi click vào vị trí trên bản đồ</p>
            <p>2. <strong>Chọn điểm kết thúc:</strong> Nhấn "Chọn trên bản đồ" rồi click vào vị trí trên bản đồ</p>
            <p>3. <strong>Tính toán:</strong> Nhấn "Tính Khoảng Cách & Dẫn Đường" để xem kết quả</p>
            <p>4. <strong>Hoặc nhập tọa độ:</strong> Có thể nhập trực tiếp vĩ độ, kinh độ vào ô input</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Start Location */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Điểm bắt đầu</h2>
              
              <div className="space-y-4">
                {/* Address display */}
                {startLocation.address && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Địa chỉ:</strong> {startLocation.address}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vĩ độ
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={startLocation.lat}
                      onChange={(e) => setStartLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kinh độ
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={startLocation.lng}
                      onChange={(e) => setStartLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      console.log('🗺️ Setting selectingLocation to start');
                      setSelectingLocation('start');
                    }}
                    className={`py-2 px-4 rounded-lg transition-colors ${
                      selectingLocation === 'start'
                        ? 'bg-green-500 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {selectingLocation === 'start' ? 'Đang chọn...' : 'Chọn trên bản đồ'}
                  </button>
                  
                  <button
                    onClick={getCurrentLocation}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Vị trí hiện tại
                  </button>
                </div>
              </div>
            </div>

            {/* End Location */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Điểm kết thúc</h2>
              
              <div className="space-y-4">
                {/* Address display */}
                {endLocation.address && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Địa chỉ:</strong> {endLocation.address}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vĩ độ
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={endLocation.lat}
                      onChange={(e) => setEndLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kinh độ
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={endLocation.lng}
                      onChange={(e) => setEndLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    console.log('🗺️ Setting selectingLocation to end');
                    setSelectingLocation('end');
                  }}
                  className={`w-full py-2 px-4 rounded-lg transition-colors ${
                    selectingLocation === 'end'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {selectingLocation === 'end' ? 'Đang chọn...' : 'Chọn trên bản đồ'}
                </button>
              </div>
            </div>

            {/* Cancel Selection Button */}
            {selectingLocation && (
              <button
                onClick={() => {
                  console.log('🗺️ Cancelling location selection');
                  setSelectingLocation(null);
                }}
                className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Hủy chọn vị trí
              </button>
            )}

            {/* Calculate Button */}
            <button
              onClick={getRoute}
              disabled={distanceLoading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition-colors font-semibold"
            >
              {distanceLoading ? 'Đang tính toán...' : 'Tính Khoảng Cách & Dẫn Đường'}
            </button>

            {/* Results */}
            {(distance > 0 || duration > 0) && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Kết quả</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Khoảng cách:</span>
                    <span className="font-semibold">{distance.toFixed(2)} km</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian dự kiến:</span>
                    <span className="font-semibold">{Math.round(duration)} phút</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tốc độ trung bình:</span>
                    <span className="font-semibold">{duration > 0 ? (distance / (duration / 60)).toFixed(1) : 0} km/h</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí giao hàng:</span>
                    <span className="font-semibold text-orange-600">{calculateDeliveryFee(distance).toLocaleString('vi-VN')}đ</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian giao hàng:</span>
                    <span className="font-semibold text-blue-600">{estimateDeliveryTime(distance)} phút</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bản đồ</h2>
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        {/* API Info */}
        <div className="mt-6 bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin API</h2>
          
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>OpenStreetMap:</strong> Bản đồ miễn phí</p>
            <p><strong>Nominatim:</strong> Geocoding miễn phí (reverse & forward)</p>
            <p><strong>OSRM:</strong> Routing API chuyên nghiệp - chỉ sử dụng route thực tế</p>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Chuyên nghiệp:</strong> Hệ thống chỉ sử dụng API routing thực tế để đảm bảo độ chính xác cao nhất. Không có fallback đường thẳng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
