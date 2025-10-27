'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
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
        // Fallback: upload via backend endpoint
        try {
          const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(`${api}/api/v1/images/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Upload failed');
          }

          const data = await response.json();
          const url = data.url || data.secure_url;
          if (!url) throw new Error('Upload failed: no URL returned');
          onChange(url);
        } catch (error) {
          console.error('Backend upload error:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Lỗi khi upload hình ảnh. Vui lòng thử lại hoặc dán link hình ảnh.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
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

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await uploadFile(imageFile);
    } else {
      alert('Vui lòng kéo thả file hình ảnh hợp lệ');
    }
  };

  // Paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await uploadFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full bg-gray-100 rounded-lg border-2 border-dashed cursor-pointer transition-colors relative overflow-hidden ${
          isDragOver 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
        } ${className.includes('h-') ? className : 'h-48'}`}
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
              <div className="text-4xl text-gray-400 mb-2">
                {isDragOver ? '📤' : '📷'}
              </div>
              <p className="text-gray-500 text-sm">
                {isDragOver ? 'Thả hình ảnh vào đây' : placeholder}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {isDragOver 
                  ? 'Hoặc nhấn Ctrl+V để dán từ clipboard' 
                  : 'Kéo thả, click chọn, hoặc Ctrl+V • JPG, PNG, GIF, WebP (tối đa 2MB)'
                }
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}