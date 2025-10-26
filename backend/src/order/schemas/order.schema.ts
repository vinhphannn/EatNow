import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',                    // Chờ xác nhận từ nhà hàng
  CONFIRMED = 'confirmed',                // Nhà hàng đã xác nhận
  PREPARING = 'preparing',                // Nhà hàng đang chuẩn bị
  READY = 'ready',                        // Sẵn sàng giao (tài xế có thể nhận)
  PICKING_UP = 'picking_up',             // Tài xế đã nhận đơn và đang đến lấy hàng
  ARRIVED_AT_RESTAURANT = 'arrived_at_restaurant', // Tài xế đã đến nhà hàng
  PICKED_UP = 'picked_up',                // Tài xế đã lấy đơn hàng
  ARRIVED_AT_CUSTOMER = 'arrived_at_customer',     // Tài xế đã đến vị trí giao hàng
  DELIVERED = 'delivered',                // Đơn hàng đã giao thành công
  CANCELLED = 'cancelled',                // Đơn hàng đã bị hủy
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
}

// Schema cho từng lựa chọn trong option
@Schema({ _id: false })
export class OrderItemOptionChoice {
  @Prop({ type: Types.ObjectId, ref: 'OptionChoiceSeparate', required: true })
  choiceId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 1, min: 1 })
  quantity: number;
}

// Schema cho từng option group
@Schema({ _id: false })
export class OrderItemOption {
  @Prop({ type: Types.ObjectId, ref: 'ItemOptionSeparate', required: true })
  optionId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['single', 'multiple'] })
  type: string;

  @Prop({ required: true })
  required: boolean;

  @Prop({ type: [OrderItemOptionChoice], default: [] })
  choices: OrderItemOptionChoice[];

  @Prop({ required: true })
  totalPrice: number;
}

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Item' })
  itemId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: [OrderItemOption], default: [] })
  options: OrderItemOption[];

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ default: '' })
  specialInstructions?: string;
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
  subtotal: number;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ default: 0 })
  tip: number;

  @Prop({ default: 0 })
  doorFee: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  finalTotal: number;

  @Prop({
    type: {
      label: { type: String, required: true },
      addressLine: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      note: { type: String },
      recipientName: { type: String, required: true },
      recipientPhone: { type: String, required: true },
    },
    required: true,
  })
  deliveryAddress: {
    label: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    note?: string;
    recipientName: string;
    recipientPhone: string;
  };

  @Prop({ default: '' })
  specialInstructions: string;

  // Purchaser contact info (người đặt hàng)
  @Prop({ required: true })
  purchaserPhone: string;

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ default: 'immediate' })
  deliveryMode: string;

  @Prop({ default: null })
  scheduledAt?: Date;

  @Prop({ default: '' })
  voucherCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'Driver', default: null })
  driverId?: Types.ObjectId;

  @Prop({ default: null })
  estimatedDeliveryTime?: Date;

  @Prop({ default: null })
  actualDeliveryTime?: Date;

  // Distance calculation (in kilometers)
  @Prop({ default: null })
  deliveryDistance?: number; // Total delivery distance in km

  // Restaurant coordinates for driver reference
  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    default: null,
  })
  restaurantCoordinates?: {
    latitude: number;
    longitude: number;
  };

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

// Tạo schemas theo thứ tự từ trong ra ngoài
export const OrderItemOptionChoiceSchema = SchemaFactory.createForClass(OrderItemOptionChoice);
export const OrderItemOptionSchema = SchemaFactory.createForClass(OrderItemOption);
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
export const OrderSchema = SchemaFactory.createForClass(Order);