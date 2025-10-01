import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  LOGGED_OUT = 'logged_out',
}

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  refreshToken: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop({ enum: SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  revokedAt?: Date;

  @Prop()
  revokedBy?: Types.ObjectId; // Admin who revoked

  @Prop()
  revokedReason?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  deviceId?: string;

  @Prop()
  deviceName?: string; // iPhone, Android, Web Browser

  @Prop()
  platform?: string; // ios, android, web

  @Prop()
  appVersion?: string;

  @Prop({ default: false })
  isCurrentSession: boolean; // Only one current session per user

  @Prop()
  metadata?: Record<string, any>;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Indexes for efficient queries
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ refreshToken: 1 });
SessionSchema.index({ accessToken: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
SessionSchema.index({ userId: 1, isCurrentSession: 1 });
SessionSchema.index({ deviceId: 1, userId: 1 });
SessionSchema.index({ ipAddress: 1, userId: 1 });
