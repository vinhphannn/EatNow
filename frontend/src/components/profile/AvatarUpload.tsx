"use client";

import { useState } from "react";
import AvatarModal from "./AvatarModal";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  onAvatarUpdate: (avatarUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function AvatarUpload({ 
  currentAvatarUrl, 
  userName, 
  onAvatarUpdate,
  size = 'lg',
  className = ''
}: AvatarUploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-24 h-24 text-lg',
    xl: 'w-32 h-32 text-xl'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBgColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleAvatarUpdate = (avatarUrl: string | null) => {
    onAvatarUpdate(avatarUrl);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Avatar Display */}
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          cursor-pointer 
          relative 
          overflow-hidden
          border-2 border-gray-200
          hover:border-orange-500
          hover:scale-105
          transition-all duration-300 ease-in-out
          flex items-center justify-center
          group
          ${currentAvatarUrl ? 'bg-gray-100' : getAvatarBgColor(userName)}
        `}
        onClick={() => setIsModalOpen(true)}
      >
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-semibold">
            {getInitials(userName)}
          </span>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <div className="text-white text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="flex flex-col items-center">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">Thay đổi</span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {currentAvatarUrl && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>

      {/* Modal */}
      <AvatarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentAvatarUrl={currentAvatarUrl}
        userName={userName}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </div>
  );
}
