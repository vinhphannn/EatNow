import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
}

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Item' })
  itemId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  subtotal: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Customer' })
  customerId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId: Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ required: true })
  finalTotal: number;

  @Prop({
    type: {
      label: { type: String, required: true },
      addressLine: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      note: { type: String },
    },
    required: true,
  })
  deliveryAddress: {
    label: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    note?: string;
  };

  @Prop({ default: '' })
  specialInstructions: string;

  // Recipient and purchaser contact info
  @Prop({ default: '' })
  recipientName?: string;

  @Prop({ default: '' })
  recipientPhonePrimary?: string;

  @Prop({ default: '' })
  recipientPhoneSecondary?: string;

  @Prop({ default: '' })
  purchaserPhone?: string;

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;

  @Prop({ default: null })
  estimatedDeliveryTime?: Date;

  @Prop({ default: null })
  actualDeliveryTime?: Date;

  // Distance calculation (in kilometers)
  @Prop({ default: null })
  distanceToRestaurant?: number;

  @Prop({ default: null })
  distanceToCustomer?: number;

  @Prop({ default: null })
  deliveryDistance?: number; // Total delivery distance in km

  // Driver assignment info
  @Prop({ default: null })
  assignedAt?: Date;

  @Prop({ default: null })
  driverRating?: number; // Hidden from driver

  @Prop({ unique: true, sparse: true })
  code?: string;

  @Prop({
    type: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, required: true },
        note: { type: String },
        updatedBy: { type: String }, // 'system', 'restaurant', 'driver', 'customer'
      },
    ],
    default: [],
  })
  trackingHistory?: Array<{
    status: string;
    timestamp: Date;
    note?: string;
    updatedBy?: string;
  }>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);