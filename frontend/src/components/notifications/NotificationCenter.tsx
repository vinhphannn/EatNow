"use client";

import { useState, useEffect, useRef } from "react";
import { notificationService } from "@/services/notification.service";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  status: 'read' | 'unread';
  actionUrl?: string;
};

type SimpleStats = { total: number; unread: number; byType: Record<string, number> };

export default function NotificationCenter({ isOpen, onClose, className = "" }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<SimpleStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'order' | 'promotion'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuth();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadNotifications();
      loadStats();
    }
  }, [isAuthenticated, isOpen, activeTab, page]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const options: any = {
        limit: 20,
        skip: (page - 1) * 20,
      };

      if (activeTab === 'unread') {
        options.unreadOnly = true;
      } else if (activeTab !== 'all') {
        options.type = activeTab;
      }

      const res = await notificationService.restaurant.getNotifications(options);
      const mapped = (res.data || []).map((n: any) => ({
        id: n._id,
        title: n.title,
        message: n.content,
        createdAt: n.createdAt,
        status: n.read ? 'read' as const : 'unread' as const,
        actionUrl: n.metadata?.actionUrl,
      }));

      if (page === 1) setNotifications(mapped);
      else setNotifications(prev => [...prev, ...mapped]);

      const total = res.pagination?.total ?? (options.skip + mapped.length);
      const hasMoreCalc = options.skip + mapped.length < total;
      setHasMore(Boolean(hasMoreCalc));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const unreadRes = await notificationService.restaurant.getUnreadCount();
      setStats({ total: notifications.length, unread: unreadRes.unreadCount || 0, byType: {} });
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const handleMarkAsRead = async (notification: NotificationItem) => {
    try {
      await notificationService.restaurant.markAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, status: 'read' as const, readAt: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' as const, readAt: new Date().toISOString() }))
      );
      await loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const getTabCount = (tab: string): number => {
    if (!stats) return 0;
    
    switch (tab) {
      case 'unread':
        return stats.unread;
      case 'order':
        return stats.byType.order || 0;
      case 'promotion':
        return stats.byType.promotion || 0;
      default:
        return stats.total;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25" />
      <div className="relative ml-auto flex h-full w-full max-w-sm flex-col overflow-y-scroll bg-white shadow-xl">
        <div ref={notificationRef} className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Thông báo</h2>
            <div className="flex items-center space-x-2">
              {stats && stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Đọc tất cả
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Tổng cộng: {stats.total}</span>
                <span className="text-red-500 font-medium">Chưa đọc: {stats.unread}</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'unread', label: 'Chưa đọc' },
              { key: 'order', label: 'Đơn hàng' },
              { key: 'promotion', label: 'Khuyến mãi' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setPage(1);
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium relative ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {getTabCount(tab.key) > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getTabCount(tab.key)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM5 17h10M5 7h14M5 12h14" />
                </svg>
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (notification.status !== 'read') {
                        handleMarkAsRead(notification);
                      }
                    }}
                    className={`p-4 cursor-pointer transition-colors ${
                      notification.status === 'read' 
                        ? 'bg-white' 
                        : 'bg-blue-50 border-l-4 border-l-blue-500'
                    } hover:bg-gray-50`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-lg">🔔</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            notification.status === 'read' ? 'text-gray-900' : 'text-gray-900 font-semibold'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{notification.message}</p>

                        {notification.actionUrl && (
                          <div className="mt-2">
                            <a
                              href={notification.actionUrl}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Xem chi tiết →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {isLoading ? 'Đang tải...' : 'Tải thêm'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
