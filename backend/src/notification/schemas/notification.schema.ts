import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  ORDER = 'order',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  DELIVERY = 'delivery',
  REVIEW = 'review',
  PAYMENT = 'payment',
  ACCOUNT = 'account',
  MARKETING = 'marketing',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: any;

  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority: NotificationPriority;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ trim: true })
  actionUrl?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Image' })
  imageId?: any;

  // Related entities
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: any;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: any;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: any;

  @Prop({ type: Types.ObjectId, ref: 'Promotion' })
  promotionId?: any;

  @Prop({ type: Types.ObjectId, ref: 'Review' })
  reviewId?: any;

  // Delivery channels
  @Prop({ default: false })
  pushNotification: boolean;

  @Prop({ default: false })
  emailNotification: boolean;

  @Prop({ default: false })
  smsNotification: boolean;

  @Prop({ default: false })
  inAppNotification: boolean;

  // Scheduling
  @Prop({ default: Date.now })
  scheduledFor: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop({ trim: true })
  failureReason?: string;

  // Targeting and personalization
  @Prop({ type: Object })
  metadata?: {
    campaignId?: string;
    segmentId?: string;
    personalizationData?: Record<string, any>;
    trackingData?: Record<string, any>;
  };

  // User preferences
  @Prop({ default: true })
  allowPush: boolean;

  @Prop({ default: true })
  allowEmail: boolean;

  @Prop({ default: false })
  allowSMS: boolean;

  // Analytics
  @Prop({ default: 0 })
  openCount: number;

  @Prop({ default: 0 })
  clickCount: number;

  @Prop()
  firstOpenedAt?: Date;

  @Prop()
  lastOpenedAt?: Date;

  @Prop()
  firstClickedAt?: Date;

  @Prop()
  lastClickedAt?: Date;

  // Batch and campaign info
  @Prop()
  batchId?: string;

  @Prop()
  campaignId?: string;

  @Prop()
  templateId?: string;

  // Expiration
  @Prop()
  expiresAt?: Date;

  @Prop({ default: false })
  isExpired: boolean;

  // Retry mechanism
  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: 3 })
  maxRetries: number;

  @Prop()
  nextRetryAt?: Date;

  // Device and platform info
  @Prop()
  deviceId?: string;

  @Prop()
  platform?: string; // ios, android, web

  @Prop()
  appVersion?: string;

  // Localization
  @Prop({ default: 'vi' })
  language: string;

  @Prop({ default: 'VN' })
  country: string;

  @Prop()
  timezone?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledFor: 1 });
NotificationSchema.index({ type: 1, priority: 1, createdAt: -1 });
NotificationSchema.index({ batchId: 1 });
NotificationSchema.index({ campaignId: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ nextRetryAt: 1 });
NotificationSchema.index({ createdAt: -1 });

// TTL index for expired notifications (auto-delete after 30 days)
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000, partialFilterExpression: { isExpired: true } });