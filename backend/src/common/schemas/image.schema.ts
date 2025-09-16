import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ImageDocument = HydratedDocument<Image>;

@Schema({ timestamps: true })
export class Image {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number; // Size in bytes

  @Prop({ required: true })
  url: string; // Cloud storage URL

  @Prop()
  cloudProvider?: string; // 'aws-s3', 'gcp', 'cloudinary', etc.

  @Prop()
  cloudKey?: string; // Key in cloud storage

  @Prop({ type: Types.ObjectId })
  uploadedBy?: any; // User ID who uploaded

  @Prop({ default: 'image' })
  type: string; // 'image', 'avatar', 'menu-item', 'restaurant', etc.

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  altText?: string; // For accessibility

  @Prop()
  width?: number;

  @Prop()
  height?: number;
}

export const ImageSchema = SchemaFactory.createForClass(Image);

// Index for efficient queries
ImageSchema.index({ uploadedBy: 1, type: 1 });
ImageSchema.index({ isActive: 1 });
