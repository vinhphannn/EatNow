'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/services/api.client';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, placeholder = "Chọn hình ảnh...", className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 2MB to match backend limit)
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 2MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary (if configured) or fallback to backend endpoint
    setUploading(true);
    try {
      // Check if Cloudinary is configured
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      
      if (cloudName && uploadPreset && cloudName !== 'your_cloud_name') {
        // Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('cloud_name', cloudName);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        onChange(data.secure_url);
      } else {
        // Fallback: upload via backend so BE stores and returns a Cloud URL
        const res = await apiClient.upload<{ id: string; url: string }>(`/api/v1/images/upload`, file);
        const url = (res as any)?.url;
        if (!url) throw new Error('Upload failed');
        onChange(url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Lỗi khi upload hình ảnh. Vui lòng thử lại hoặc dán link hình ảnh.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onChange('');
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = value || preview;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Upload Area */}
      <div 
        onClick={handleClick}
        className={`w-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-orange-400 hover:bg-gray-50 transition-colors relative overflow-hidden ${className.includes('h-') ? className : 'h-48'}`}
      >
        {displayImage ? (
          <div className="relative w-full h-full">
            <img 
              src={displayImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Đang upload...</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">📷</div>
              <p className="text-gray-500 text-sm">{placeholder}</p>
              <p className="text-gray-400 text-xs mt-1">JPG, PNG, GIF, WebP (tối đa 10MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Alternative URL Input */}
      <div className="mt-2">
        <details className="text-sm" open>
          <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
            Dán link hình ảnh (Cloudinary chưa được cấu hình)
          </summary>
          <div className="mt-2">
            <input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Để upload file trực tiếp, hãy cấu hình Cloudinary trong file .env.local
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}