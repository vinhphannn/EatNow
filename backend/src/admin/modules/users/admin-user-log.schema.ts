import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserAdminLogDocument = HydratedDocument<UserAdminLog>;

@Schema({ timestamps: true })
export class UserAdminLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: any;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: any;

  @Prop({ enum: ['SUSPEND','BAN','NOTE','WARN','ACTIVATE','UNLOCK'] })
  action: 'SUSPEND' | 'BAN' | 'NOTE' | 'WARN' | 'ACTIVATE' | 'UNLOCK';

  @Prop()
  reason?: string;
}

export const UserAdminLogSchema = SchemaFactory.createForClass(UserAdminLog);


