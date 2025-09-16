import { CLOUDINARY_CONFIG } from '../config';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: any;
  quality?: string | number;
  format?: string;
}

class CloudinaryService {
  private cloudName: string;

  constructor() {
    this.cloudName = CLOUDINARY_CONFIG.CLOUD_NAME;
    
    if (!this.cloudName) {
      console.error('Cloudinary Cloud Name is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local');
    }
  }

  /**
   * Upload image to Cloudinary using Upload Widget
   */
  async uploadImage(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      // Check if Cloudinary is configured
      if (!this.cloudName) {
        throw new Error('Cloudinary Cloud Name is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local');
      }

      if (!CLOUDINARY_CONFIG.UPLOAD_PRESET) {
        throw new Error('Cloudinary Upload Preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
      formData.append('folder', options.folder || 'eatnow');
      
      // Note: quality and format should be set in the upload preset, not in the request
      // for unsigned uploads

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary API Error:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: File[],
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Cloudinary multiple upload error:', error);
      throw new Error('Failed to upload multiple images to Cloudinary');
    }
  }

  /**
   * Delete image from Cloudinary (requires server-side implementation)
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      // This should be implemented on the server-side for security
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  /**
   * Get optimized image URL
   */
  getOptimizedImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string | number;
      format?: string;
      crop?: string;
      gravity?: string;
    } = {}
  ): string {
    const {
      width,
      height,
      quality = 'auto',
      format = 'auto',
      crop = 'fill',
      gravity = 'auto',
    } = options;

    let transformation = '';
    
    if (width || height) {
      transformation += `w_${width || 'auto'},h_${height || 'auto'},c_${crop},g_${gravity},`;
    }
    
    transformation += `q_${quality},f_${format}`;

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformation}/${publicId}`;
  }

  /**
   * Get image info (requires server-side implementation)
   */
  async getImageInfo(publicId: string) {
    try {
      const response = await fetch(`/api/cloudinary/info?publicId=${publicId}`);
      if (!response.ok) {
        throw new Error('Failed to get image info');
      }
      return await response.json();
    } catch (error) {
      console.error('Cloudinary get info error:', error);
      throw new Error('Failed to get image info from Cloudinary');
    }
  }
}

export const cloudinaryService = new CloudinaryService();
