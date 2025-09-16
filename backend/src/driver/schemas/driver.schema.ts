import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DriverDocument = HydratedDocument<Driver>;

export enum DriverStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  OFFLINE = 'offline',
}

@Schema({ timestamps: true })
export class Driver {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ enum: DriverStatus, default: DriverStatus.INACTIVE })
  status: DriverStatus;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
  })
  locationType?: string;

  @Prop({ type: [Number], index: '2dsphere', default: undefined })
  location?: number[]; // [lng, lat]

  @Prop()
  lastLocationAt?: Date;

  @Prop({ default: 0 })
  totalDeliveries: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  // Hidden performance metrics (not shown to driver)
  @Prop({ default: 0 })
  performanceScore: number; // 0-100, calculated by system

  @Prop({ default: 0 })
  ordersRejected: number;

  @Prop({ default: 0 })
  ordersSkipped: number;

  @Prop({ default: 0 })
  ordersCompleted: number;

  @Prop({ default: 0 })
  averageDeliveryTime: number; // in minutes

  @Prop({ default: 0 })
  onTimeDeliveries: number;

  @Prop({ default: 0 })
  lateDeliveries: number;

  @Prop()
  licenseNumber?: string;

  @Prop()
  vehicleType?: string; // motorbike, car, bicycle

  @Prop()
  vehicleNumber?: string;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop()
  currentOrderId?: Types.ObjectId;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);


