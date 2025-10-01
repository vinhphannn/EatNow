import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryZoneDocument = HydratedDocument<DeliveryZone>;

export enum ZoneStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Schema({ timestamps: true })
export class DeliveryZone {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ enum: ZoneStatus, default: ZoneStatus.ACTIVE })
  status: ZoneStatus;

  @Prop({
    type: {
      type: { type: String, enum: ['Polygon'], default: 'Polygon' },
      coordinates: { type: [[[Number]]], required: true },
    },
    required: true,
    index: '2dsphere',
  })
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };

  @Prop({ required: true })
  deliveryFee: number; // Base delivery fee for this zone

  @Prop()
  freeDeliveryThreshold?: number; // Minimum order amount for free delivery

  @Prop({ default: 30 })
  estimatedDeliveryTime: number; // In minutes

  @Prop({ default: 0 })
  maxDeliveryDistance: number; // In meters

  @Prop({ type: [Types.ObjectId], ref: 'Driver' })
  assignedDrivers?: Types.ObjectId[];

  @Prop({ default: 0 })
  driverCount: number; // Number of drivers in this zone

  @Prop({ default: 0 })
  activeDriverCount: number; // Number of active drivers

  @Prop()
  centerLatitude?: number;

  @Prop()
  centerLongitude?: number;

  @Prop()
  city?: string;

  @Prop()
  district?: string;

  @Prop()
  ward?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  metadata?: Record<string, any>;
}

export const DeliveryZoneSchema = SchemaFactory.createForClass(DeliveryZone);

// Indexes for efficient queries
DeliveryZoneSchema.index({ geometry: '2dsphere' });
DeliveryZoneSchema.index({ status: 1, isActive: 1 });
DeliveryZoneSchema.index({ assignedDrivers: 1 });
DeliveryZoneSchema.index({ city: 1, district: 1 });
DeliveryZoneSchema.index({ centerLatitude: 1, centerLongitude: 1 });
