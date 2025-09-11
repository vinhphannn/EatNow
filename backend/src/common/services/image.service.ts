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
  ): Promise<{ id: string; filename: string; size: number }> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size too large. Maximum allowed: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Validate mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Create image document
    const imageDoc = await this.imageModel.create({
      filename: file.filename || `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      uploadedBy,
      type,
    });

    return {
      id: String(imageDoc._id),
      filename: imageDoc.filename,
      size: imageDoc.size,
    };
  }

  async getImage(id: string): Promise<{ data: Buffer; mimeType: string; filename: string } | null> {
    const image = await this.imageModel.findById(id).lean();
    if (!image || !image.isActive) {
      return null;
    }

    return {
      data: image.data,
      mimeType: image.mimeType,
      filename: image.filename,
    };
  }

  async deleteImage(id: string): Promise<boolean> {
    const result = await this.imageModel.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    return !!result;
  }

  async getImageInfo(id: string): Promise<{ id: string; filename: string; size: number; mimeType: string } | null> {
    const image = await this.imageModel.findById(id).lean();
    if (!image || !image.isActive) {
      return null;
    }

    return {
      id: String(image._id),
      filename: image.filename,
      size: image.size,
      mimeType: image.mimeType,
    };
  }
}
