'use client';

import { useState } from 'react';
import { ImageUpload, ImageDisplay, useToast } from '../../components';
import { CloudinaryUploadResult } from '../../services/cloudinary';

export default function TestCloudinaryPage() {
  const [uploadedImages, setUploadedImages] = useState<CloudinaryUploadResult[]>([]);
  const { showToast, ToastContainer } = useToast();

  const handleUpload = (result: CloudinaryUploadResult) => {
    setUploadedImages(prev => [...prev, result]);
    showToast('Image uploaded successfully!', 'success');
  };

  const handleError = (error: string) => {
    showToast(error, 'error');
  };

  const handleDelete = (publicId: string) => {
    setUploadedImages(prev => prev.filter(img => img.public_id !== publicId));
    showToast('Image deleted successfully!', 'success');
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cloudinary Image Upload Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Upload Images</h2>
            
            {/* Single Image Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Single Image Upload</h3>
              <ImageUpload
                onUpload={handleUpload}
                onError={handleError}
                folder="eatnow/test"
                maxSize={5}
                className="mb-4"
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Click to upload single image</p>
                      <p className="text-sm text-gray-500">JPEG, PNG, WebP up to 5MB</p>
                    </div>
                  </div>
                </div>
              </ImageUpload>
            </div>

            {/* Multiple Images Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Multiple Images Upload</h3>
              <ImageUpload
                onUpload={handleUpload}
                onError={handleError}
                folder="eatnow/test"
                maxSize={5}
                multiple={true}
                className="mb-4"
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Click to upload multiple images</p>
                      <p className="text-sm text-gray-500">JPEG, PNG, WebP up to 5MB each</p>
                    </div>
                  </div>
                </div>
              </ImageUpload>
            </div>
          </div>

          {/* Display Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Uploaded Images</h2>
            
            {uploadedImages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No images uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.public_id} className="bg-white rounded-lg shadow-sm border">
                    <ImageDisplay
                      publicId={image.public_id}
                      alt="Uploaded image"
                      width={300}
                      height={200}
                      className="w-full h-48 rounded-t-lg"
                      showDelete={true}
                      onDelete={() => handleDelete(image.public_id)}
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 truncate">
                        {image.public_id.split('/').pop()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {image.width} × {image.height} • {image.format.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(image.bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </main>
  );
}
