import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image, ImageDocument } from '../schemas/image.schema';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ImageService {
  private readonly maxFileSize = 2 * 1024 * 1024; // 2MB limit
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  constructor(
    @InjectModel(Image.name) private readonly imageModel: Model<ImageDocument>,
  ) {
    // Configure Cloudinary from env variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    
    console.log('Cloudinary Config Check:', {
      hasCloudName: !!cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
    });
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadImage(
    file: any,
    uploadedBy?: string,
    type: string = 'image'
  ): Promise<{ id: string; filename: string; size: number; url: string }> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size too large. Maximum allowed: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Validate mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Check if Cloudinary is configured
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;
    
    if (!isCloudinaryConfigured) {
      // Local storage fallback when Cloudinary is not configured
      console.warn('Cloudinary not configured, using local storage fallback');
      const localUrl = `/uploads/${Date.now()}-${file.originalname || file.filename || 'image'}`;
      
      const imageDoc = await this.imageModel.create({
        filename: file.originalname || file.filename || 'image',
        originalName: file.originalname || file.filename || 'image',
        mimeType: file.mimetype,
        size: file.size,
        url: localUrl,
        cloudProvider: 'local',
        cloudKey: localUrl,
        uploadedBy,
        type,
        width: 0,
        height: 0,
      });
      
      return {
        id: String(imageDoc._id),
        filename: imageDoc.filename,
        size: imageDoc.size,
        url: localUrl,
      };
    }

    let uploadResult: any;
    try {
      if (file.buffer) {
        uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'eatnow', resource_type: 'image' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(file.buffer);
        });
      } else if (file.path) {
        uploadResult = await cloudinary.uploader.upload(file.path, { folder: 'eatnow', resource_type: 'image' });
      } else {
        throw new BadRequestException('Invalid upload: missing file buffer or path');
      }
    } catch (e: any) {
      throw new InternalServerErrorException(e?.message || 'Cloud upload failed');
    }

    const secureUrl = uploadResult.secure_url as string;
    const publicId = uploadResult.public_id as string;

    const imageDoc = await this.imageModel.create({
      filename: file.originalname || file.filename || publicId,
      originalName: file.originalname || file.filename || publicId,
      mimeType: file.mimetype,
      size: file.size,
      url: secureUrl,
      cloudProvider: 'cloudinary',
      cloudKey: publicId,
      uploadedBy,
      type,
      width: uploadResult.width || 0,
      height: uploadResult.height || 0,
    });

    return {
      id: String(imageDoc._id),
      filename: imageDoc.filename,
      size: imageDoc.size,
      url: imageDoc.url,
    };
  }

  async getImageUrl(id: string): Promise<{ url: string; mimeType: string; filename: string } | null> {
    const image = await this.imageModel.findById(id).lean();
    if (!image || !image.isActive) {
      return null;
    }

    return {
      url: image.url,
      mimeType: image.mimeType,
      filename: image.filename,
    };
  }

  async deleteImage(id: string): Promise<boolean> {
    const image = await this.imageModel.findById(id);
    if (!image) {
      return false;
    }

    // Attempt to delete from Cloudinary
    try {
      if (image.cloudProvider === 'cloudinary' && image.cloudKey) {
        await cloudinary.uploader.destroy(image.cloudKey);
      }
    } catch {}

    // Soft delete in database
    const result = await this.imageModel.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    return !!result;
  }

  async getImageInfo(id: string): Promise<{ 
    id: string; 
    filename: string; 
    size: number; 
    mimeType: string; 
    url: string;
    width?: number;
    height?: number;
  } | null> {
    const image = await this.imageModel.findById(id).lean();
    if (!image || !image.isActive) {
      return null;
    }

    return {
      id: String(image._id),
      filename: image.filename,
      size: image.size,
      mimeType: image.mimeType,
      url: image.url,
      width: image.width,
      height: image.height,
    };
  }

  async getImageByCloudKey(cloudKey: string): Promise<ImageDocument | null> {
    return this.imageModel.findOne({ cloudKey, isActive: true });
  }

  async updateImageMetadata(id: string, metadata: {
    width?: number;
    height?: number;
    altText?: string;
  }): Promise<boolean> {
    const result = await this.imageModel.findByIdAndUpdate(
      id,
      { ...metadata },
      { new: true }
    );
    return !!result;
  }
}
