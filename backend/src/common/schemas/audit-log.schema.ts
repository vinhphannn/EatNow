import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

export enum AuditAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset',
  
  // User Management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_SUSPENDED = 'user_suspended',
  USER_ACTIVATED = 'user_activated',
  
  // Order Management
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_REFUNDED = 'order_refunded',
  
  // Payment
  PAYMENT_CREATED = 'payment_created',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  
  // Restaurant Management
  RESTAURANT_CREATED = 'restaurant_created',
  RESTAURANT_UPDATED = 'restaurant_updated',
  RESTAURANT_APPROVED = 'restaurant_approved',
  RESTAURANT_SUSPENDED = 'restaurant_suspended',
  
  // Driver Management
  DRIVER_CREATED = 'driver_created',
  DRIVER_UPDATED = 'driver_updated',
  DRIVER_APPROVED = 'driver_approved',
  DRIVER_SUSPENDED = 'driver_suspended',
  
  // Promotion Management
  PROMOTION_CREATED = 'promotion_created',
  PROMOTION_UPDATED = 'promotion_updated',
  PROMOTION_ACTIVATED = 'promotion_activated',
  PROMOTION_DEACTIVATED = 'promotion_deactivated',
  
  // System
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  
  // Security
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // User who performed the action

  @Prop({ enum: AuditAction, required: true })
  action: AuditAction;

  @Prop({ enum: AuditLevel, default: AuditLevel.INFO })
  level: AuditLevel;

  @Prop({ required: true })
  description: string;

  @Prop()
  details?: Record<string, any>; // Additional details about the action

  @Prop()
  oldValues?: Record<string, any>; // Previous values (for updates)

  @Prop()
  newValues?: Record<string, any>; // New values (for updates)

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  deviceId?: string;

  @Prop()
  platform?: string; // ios, android, web, admin

  @Prop()
  appVersion?: string;

  // Related entities
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Promotion' })
  promotionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  targetUserId?: Types.ObjectId; // User affected by the action

  @Prop()
  sessionId?: string; // Session ID if available

  @Prop()
  requestId?: string; // Request ID for tracing

  @Prop()
  metadata?: Record<string, any>;

  @Prop({ default: true })
  isVisible: boolean; // For filtering sensitive logs
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for efficient queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ level: 1, createdAt: -1 });
AuditLogSchema.index({ orderId: 1, createdAt: -1 });
AuditLogSchema.index({ restaurantId: 1, createdAt: -1 });
AuditLogSchema.index({ driverId: 1, createdAt: -1 });
AuditLogSchema.index({ paymentId: 1, createdAt: -1 });
AuditLogSchema.index({ targetUserId: 1, createdAt: -1 });
AuditLogSchema.index({ ipAddress: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ isVisible: 1, createdAt: -1 });
