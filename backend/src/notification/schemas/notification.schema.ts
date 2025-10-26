import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationActor {
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant', 
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export enum NotificationType {
  // Customer notifications
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing', 
  ORDER_READY = 'order_ready',
  ORDER_DELIVERING = 'order_delivering',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  
  // Restaurant notifications
  NEW_ORDER = 'new_order',
  ORDER_ACCEPTED = 'order_accepted',
  ORDER_REJECTED = 'order_rejected',
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_ARRIVED = 'driver_arrived',
  
  // Driver notifications
  ORDER_ASSIGNED = 'order_assigned',
  ORDER_PICKUP_READY = 'order_pickup_ready',
  ORDER_DELIVERY_COMPLETE = 'order_delivery_complete',
  PAYMENT_COLLECTED = 'payment_collected',
  
  // Admin notifications
  SYSTEM_ALERT = 'system_alert',
  RESTAURANT_REGISTRATION = 'restaurant_registration',
  DRIVER_REGISTRATION = 'driver_registration',
  PAYMENT_ISSUE = 'payment_issue',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class Notification {
  // Target actor (who receives this notification)
  @Prop({ 
    type: String, 
    enum: Object.values(NotificationActor), 
    required: true 
  })
  targetActor: NotificationActor;

  // Target user ID (restaurantId, customerId, driverId, adminId)
  @Prop({ required: true })
  targetUserId: string;

  // Related entities
  @Prop({ type: Types.ObjectId, ref: 'Order', required: false })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: false })
  restaurantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: false })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver', required: false })
  driverId?: Types.ObjectId;

  // Notification content
  @Prop({ 
    type: String, 
    enum: Object.values(NotificationType), 
    required: true 
  })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ 
    type: String, 
    enum: Object.values(NotificationPriority), 
    default: NotificationPriority.MEDIUM 
  })
  priority: NotificationPriority;

  // Read status
  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Date, required: false })
  readAt?: Date;

  // Additional data
  @Prop({ type: Object, required: false })
  metadata?: {
    orderCode?: string;
    customerName?: string;
    restaurantName?: string;
    driverName?: string;
    total?: number;
    deliveryAddress?: string;
    [key: string]: any;
  };

  // Timestamps
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for better performance
NotificationSchema.index({ targetActor: 1, targetUserId: 1, createdAt: -1 });
NotificationSchema.index({ targetActor: 1, targetUserId: 1, read: 1 });
NotificationSchema.index({ orderId: 1 });
NotificationSchema.index({ restaurantId: 1, createdAt: -1 });
NotificationSchema.index({ customerId: 1, createdAt: -1 });
NotificationSchema.index({ driverId: 1, createdAt: -1 });