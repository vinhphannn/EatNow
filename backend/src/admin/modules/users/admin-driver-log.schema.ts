import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DriverAdminLogDocument = HydratedDocument<DriverAdminLog>;

@Schema({ timestamps: true })
export class DriverAdminLog {
  @Prop({ type: Types.ObjectId, ref: 'Driver', required: true })
  driverId: any;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: any;

  @Prop({ enum: ['SUSPEND','BAN','NOTE','WARN','ACTIVATE','UNLOCK'] })
  action: 'SUSPEND' | 'BAN' | 'NOTE' | 'WARN' | 'ACTIVATE' | 'UNLOCK';

  @Prop()
  reason?: string;
}

export const DriverAdminLogSchema = SchemaFactory.createForClass(DriverAdminLog);


