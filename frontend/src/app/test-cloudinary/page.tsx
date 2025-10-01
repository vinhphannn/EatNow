'use client';

import { useState } from 'react';
import ImageUpload from '../../components/ImageUpload';

export default function TestCloudinaryPage() {
  const [imageUrl, setImageUrl] = useState<string>('');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Cloudinary Upload</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Upload Test</h2>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="Chọn hình ảnh để test upload"
              />
            </div>

            {imageUrl && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Uploaded Image URL:</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm break-all">{imageUrl}</code>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Preview:</h4>
                  <img 
                    src={imageUrl} 
                    alt="Uploaded" 
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-md font-semibold text-blue-800 mb-2">Environment Variables:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Cloud Name: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'Not set'}</p>
                <p>Upload Preset: {process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Not set'}</p>
                <p>API Key: {process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || 'Not set'}</p>
              </div>
              
              {(!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
                process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME === 'your_cloud_name') && (
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Cloudinary chưa được cấu hình!</h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Để upload file trực tiếp, hãy làm theo hướng dẫn trong file:
                  </p>
                  <code className="text-xs bg-yellow-200 px-2 py-1 rounded">SETUP_CLOUDINARY.md</code>
                  <p className="text-sm text-yellow-700 mt-2">
                    Hoặc sử dụng URL hình ảnh từ internet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}