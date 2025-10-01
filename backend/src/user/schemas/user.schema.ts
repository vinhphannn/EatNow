import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  RESTAURANT = 'restaurant',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  fullName?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: String })
  avatarUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Image' })
  avatarId?: any;

  // Basic personal info (detailed info moved to specific role schemas)
  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender?: string;

  @Prop({ type: String, trim: true })
  bio?: string;

  // Account status and verification
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ type: Date })
  emailVerifiedAt?: Date;

  @Prop({ type: Date })
  phoneVerifiedAt?: Date;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: Date })
  lastActiveAt?: Date;

  // Basic preferences (detailed preferences moved to specific role schemas)
  @Prop({ default: 'vi' })
  language: string;

  @Prop({ default: 'VN' })
  country: string;

  @Prop({ type: String })
  timezone?: string;

  @Prop({ default: 'vietnam_dong' })
  currency: string;

  @Prop({ default: true })
  allowPushNotifications: boolean;

  @Prop({ default: true })
  allowEmailNotifications: boolean;

  @Prop({ default: false })
  allowSMSNotifications: boolean;

  @Prop({ default: true })
  allowMarketingEmails: boolean;

  @Prop({ default: true })
  allowLocationTracking: boolean;

  // Security and compliance
  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ type: Date })
  passwordChangedAt?: Date;

  @Prop({ type: [String], default: [] })
  passwordHistory?: string[];

  // Device and session management
  @Prop({ type: [String], default: [] })
  deviceTokens?: string[]; // For push notifications

  @Prop({ type: Object })
  lastDeviceInfo?: {
    userAgent?: string;
    platform?: string;
    version?: string;
    model?: string;
  };

  // Privacy and data
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Date })
  dataRetentionUntil?: Date;

  // Reference to role-specific collections
  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customerProfile?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantProfile?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverProfile?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  adminProfile?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for efficient queries
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ isEmailVerified: 1 });
UserSchema.index({ isPhoneVerified: 1 });
UserSchema.index({ lastLoginAt: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isDeleted: 1, deletedAt: 1 });
UserSchema.index({ customerProfile: 1 });
UserSchema.index({ restaurantProfile: 1 });
UserSchema.index({ driverProfile: 1 });
UserSchema.index({ adminProfile: 1 });


