import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Index } from 'typeorm';

export type DriverDocument = HydratedDocument<Driver>;

@Schema({ timestamps: true })
export class Driver {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: any;

  @Prop({ default: 'inactive' })
  status: string; // inactive | active | suspended

  // Location tracking
  @Prop({ type: [Number], default: [0, 0] })
  location: [number, number]; // [longitude, latitude]

  @Prop({ type: Date })
  lastLocationAt?: Date;

  // Performance metrics
  @Prop({ default: 0 })
  ordersCompleted: number;

  @Prop({ default: 0 })
  ordersRejected: number;

  @Prop({ default: 0 })
  ordersSkipped: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: 0 })
  onTimeDeliveries: number;

  @Prop({ default: 0 })
  lateDeliveries: number;

  // Vehicle info
  @Prop()
  vehicleType?: string;

  @Prop()
  licensePlate?: string;

  // Bank info for payouts
  @Prop()
  bankAccount?: string;

  @Prop()
  bankName?: string;

  // Performance tracking
  @Prop({ default: 0 })
  totalDeliveries: number;

  @Prop({ default: 0 })
  averageDeliveryTime: number; // in minutes

  @Prop({ default: 0 })
  performanceScore: number;

  // Auto simulation mode for development/testing
  @Prop({ default: false })
  isAuto?: boolean;

  @Prop({ type: Object, default: null })
  autoMeta?: {
    city?: string;
    currentTarget?: { lat: number; lng: number; type: 'restaurant' | 'customer' } | null;
    speedKmh?: number;
  } | null;

  // Minimal wallet for delivery earnings
  @Prop({ default: 0 })
  walletBalance: number; // Accumulated delivery fees awaiting payout

}

export const DriverSchema = SchemaFactory.createForClass(Driver);


