import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image, ImageDocument } from '../schemas/image.schema';

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
  ) {}

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

    // TODO: Implement cloud storage upload (AWS S3, GCP, Cloudinary, etc.)
    // For now, we'll simulate with a placeholder URL
    const cloudUrl = `https://example-cloud-storage.com/images/${Date.now()}-${file.originalname}`;
    const cloudKey = `images/${Date.now()}-${file.originalname}`;

    // Create image document with cloud storage metadata
    const imageDoc = await this.imageModel.create({
      filename: file.filename || `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: cloudUrl,
      cloudProvider: 'aws-s3', // or 'gcp', 'cloudinary', etc.
      cloudKey: cloudKey,
      uploadedBy,
      type,
      width: 0, // TODO: Extract from image metadata
      height: 0, // TODO: Extract from image metadata
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

    // TODO: Delete from cloud storage
    // await this.cloudStorageService.delete(image.cloudKey);

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

  // New method to get image by cloud key
  async getImageByCloudKey(cloudKey: string): Promise<ImageDocument | null> {
    return this.imageModel.findOne({ cloudKey, isActive: true });
  }

  // New method to update image metadata
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
