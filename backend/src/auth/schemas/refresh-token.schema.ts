import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: any;

  @Prop({ required: true, unique: true })
  jti: string; // token id

  @Prop({ required: true })
  tokenHash: string; // hash of the refresh token value

  @Prop()
  parentJti?: string; // for rotation chain

  @Prop()
  deviceId?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ip?: string;

  @Prop({ default: 'active' })
  status: 'active' | 'rotated' | 'revoked' | 'expired';

  @Prop()
  expiresAt?: Date;

  @Prop()
  rotatedAt?: Date;

  @Prop()
  revokedAt?: Date;

  @Prop()
  csrf?: string; // double-submit token
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ userId: 1, status: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: 'date' } } });


