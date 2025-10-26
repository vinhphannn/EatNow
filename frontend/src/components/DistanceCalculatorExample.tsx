"use client";

import { useState } from 'react';
import { useDistanceCalculator } from '@/hooks/useDistanceCalculator';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export default function DistanceCalculatorExample() {
  const { 
    calculateDistance, 
    quickDistance, 
    calculateDeliveryFee, 
    estimateDeliveryTime,
    loading 
  } = useDistanceCalculator();

  const [startLocation, setStartLocation] = useState<Location>({
    lat: 10.8231,
    lng: 106.6297,
    address: 'Quận 1, TP.HCM'
  });

  const [endLocation, setEndLocation] = useState<Location>({
    lat: 10.7769,
    lng: 106.7009,
    address: 'Quận 7, TP.HCM'
  });

  const [result, setResult] = useState<any>(null);

  const handleCalculate = async () => {
    const result = await calculateDistance(startLocation, endLocation);
    
    setResult(result);
  };

  const handleQuickCalculate = () => {
    const distance = quickDistance(
      startLocation.lat, startLocation.lng,
      endLocation.lat, endLocation.lng
    );
    
    setResult({
      distance,
      duration: distance * 2,
      success: true
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Ví dụ sử dụng Distance Calculator Hook</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Điểm bắt đầu:</label>
          <input
            type="text"
            value={startLocation.address}
            onChange={(e) => setStartLocation(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-2 border rounded"
            placeholder="Nhập địa chỉ bắt đầu"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Điểm kết thúc:</label>
          <input
            type="text"
            value={endLocation.address}
            onChange={(e) => setEndLocation(prev => ({ ...prev, address: e.target.value }))}
            className="w-full p-2 border rounded"
            placeholder="Nhập địa chỉ kết thúc"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Đang tính...' : 'Tính chi tiết (API)'}
          </button>
          
          <button
            onClick={handleQuickCalculate}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Tính nhanh (Đường thẳng)
          </button>
        </div>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Kết quả:</h3>
            <div className="space-y-1 text-sm">
              <div>Khoảng cách: {result.distance?.toFixed(2)} km</div>
              <div>Thời gian: {Math.round(result.duration)} phút</div>
              <div>Phí giao hàng: {calculateDeliveryFee(result.distance).toLocaleString('vi-VN')}đ</div>
              <div>Thời gian giao hàng: {estimateDeliveryTime(result.distance)} phút</div>
              <div>Thành công: {result.success ? 'Có' : 'Không'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
