'use client';

import { useState, useRef } from 'react';
import { cloudinaryService, CloudinaryUploadResult } from '../services/cloudinary';

interface ImageUploadProps {
  onUpload: (result: CloudinaryUploadResult) => void;
  onError?: (error: string) => void;
  folder?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function ImageUpload({
  onUpload,
  onError,
  folder = 'eatnow',
  maxSize = 5, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  multiple = false,
  className = '',
  children,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate file size
    const oversizedFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      onError?.(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    const invalidFiles = fileArray.filter(file => !acceptedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      onError?.('Invalid file type. Please upload JPEG, PNG, or WebP images.');
      return;
    }

    setUploading(true);

    try {
      if (multiple) {
        const results = await cloudinaryService.uploadMultipleImages(fileArray, { folder });
        results.forEach(result => onUpload(result));
      } else {
        const result = await cloudinaryService.uploadImage(fileArray[0], { folder });
        onUpload(result);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        className={`
          cursor-pointer transition-all duration-200
          ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {children || (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">
                  {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxSize}MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
