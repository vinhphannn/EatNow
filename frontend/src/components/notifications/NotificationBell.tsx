"use client";

import { useState, useEffect } from "react";
import { notificationService } from "@/services/notification.service";
import NotificationCenter from "./NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = "" }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load unread count
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      
      // Set up polling for real-time updates
      const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      // Silently ignore auth errors - user might not be logged in
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        setUnreadCount(0);
        return;
      }
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleBellClick = () => {
    setIsNotificationCenterOpen(true);
  };

  const handleNotificationCenterClose = () => {
    setIsNotificationCenterOpen(false);
    // Refresh unread count when notification center closes
    loadUnreadCount();
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={handleBellClick}
        className={`relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors ${className}`}
        title="Thông báo"
      >
        {/* Bell Icon */}
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM5 17h10M5 7h14M5 12h14"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={handleNotificationCenterClose}
      />
    </>
  );
}
