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
  data: Buffer; // Binary data

  @Prop({ type: Types.ObjectId })
  uploadedBy?: any; // User ID who uploaded

  @Prop({ default: 'image' })
  type: string; // 'image', 'avatar', 'menu-item', etc.

  @Prop({ default: true })
  isActive: boolean;
}

export const ImageSchema = SchemaFactory.createForClass(Image);

// Index for efficient queries
ImageSchema.index({ uploadedBy: 1, type: 1 });
ImageSchema.index({ isActive: 1 });
