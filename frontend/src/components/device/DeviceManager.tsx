'use client';

import { useState, useEffect } from 'react';
import { useAdvancedAuth } from '@/contexts/AdvancedAuthContext';

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastActive: string;
  isCurrent: boolean;
  location?: string;
}

export function DeviceManager() {
  const { activeDevices, terminateDevice, logoutAllDevices } = useAdvancedAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, [activeDevices]);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      // Mock device data - thay thế bằng API call thật
      const mockDevices: Device[] = [
        {
          id: 'device_1',
          name: 'MacBook Pro',
          type: 'desktop',
          browser: 'Chrome 120.0',
          os: 'macOS 14.0',
          lastActive: new Date().toISOString(),
          isCurrent: true,
          location: 'Ho Chi Minh City, Vietnam',
        },
        {
          id: 'device_2',
          name: 'iPhone 15',
          type: 'mobile',
          browser: 'Safari 17.0',
          os: 'iOS 17.0',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          isCurrent: false,
          location: 'Ho Chi Minh City, Vietnam',
        },
        {
          id: 'device_3',
          name: 'Windows PC',
          type: 'desktop',
          browser: 'Edge 120.0',
          os: 'Windows 11',
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          isCurrent: false,
          location: 'Hanoi, Vietnam',
        },
      ];
      
      setDevices(mockDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateDevice = async (deviceId: string) => {
    if (window.confirm('Bạn có chắc muốn đăng xuất thiết bị này?')) {
      try {
        await terminateDevice(deviceId);
        setDevices(devices.filter(d => d.id !== deviceId));
      } catch (error) {
        console.error('Failed to terminate device:', error);
        alert('Không thể đăng xuất thiết bị. Vui lòng thử lại.');
      }
    }
  };

  const handleLogoutAllDevices = async () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất tất cả thiết bị? Bạn sẽ cần đăng nhập lại trên tất cả thiết bị.')) {
      try {
        await logoutAllDevices();
      } catch (error) {
        console.error('Failed to logout all devices:', error);
        alert('Không thể đăng xuất tất cả thiết bị. Vui lòng thử lại.');
      }
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'mobile':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Thiết bị đã đăng nhập</h3>
          <button
            onClick={handleLogoutAllDevices}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Đăng xuất tất cả
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {devices.map((device) => (
          <div key={device.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    device.isCurrent ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getDeviceIcon(device.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {device.name}
                    </p>
                    {device.isCurrent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Thiết bị hiện tại
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1 text-sm text-gray-500">
                    <p>{device.browser} • {device.os}</p>
                    <p>{device.location}</p>
                    <p>Hoạt động cuối: {formatLastActive(device.lastActive)}</p>
                  </div>
                </div>
              </div>

              {!device.isCurrent && (
                <button
                  onClick={() => handleTerminateDevice(device.id)}
                  className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Đăng xuất
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <div className="px-6 py-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có thiết bị nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bạn chưa đăng nhập trên thiết bị nào khác.
          </p>
        </div>
      )}
    </div>
  );
}
