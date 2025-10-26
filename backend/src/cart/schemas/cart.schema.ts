import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

// Khai báo các class trước
@Schema({ _id: false })
export class CartItemOptionChoice {
  @Prop({ type: Types.ObjectId, ref: 'OptionChoiceSeparate', required: true })
  choiceId: Types.ObjectId;

  // Snapshot data
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 1, min: 1 })
  quantity: number;
}

@Schema({ _id: false })
export class CartItemOption {
  @Prop({ type: Types.ObjectId, ref: 'ItemOptionSeparate', required: true })
  optionId: Types.ObjectId;

  // Snapshot data
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['single', 'multiple'] })
  type: string;

  @Prop({ required: true })
  required: boolean;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  choices: CartItemOptionChoice[];

  @Prop({ required: true })
  totalPrice: number; // = sum(choices.price * choices.quantity)
}

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  itemId: Types.ObjectId;

  // Snapshot data để tránh thay đổi giá/tên sau khi thêm vào giỏ
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true, min: 1, default: 1 })
  quantity: number;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  options: CartItemOption[];

  @Prop({ required: true })
  subtotal: number; // = quantity * price

  @Prop({ required: true })
  totalPrice: number; // = subtotal + sum(options.totalPrice)
}

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurantId: Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  totalItems: number;

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ default: 0 })
  itemCount: number; // Số loại món khác nhau
}

// Tạo schemas theo thứ tự từ trong ra ngoài
export const CartItemOptionChoiceSchema = SchemaFactory.createForClass(CartItemOptionChoice);
export const CartItemOptionSchema = SchemaFactory.createForClass(CartItemOption);
export const CartItemSchema = SchemaFactory.createForClass(CartItem);
export const CartSchema = SchemaFactory.createForClass(Cart);

// Indexes for optimal performance
CartSchema.index({ userId: 1, restaurantId: 1 });
CartSchema.index({ userId: 1 });
CartSchema.index({ restaurantId: 1 });
CartSchema.index({ updatedAt: -1 });

// Unique constraint: mỗi user chỉ có 1 giỏ hàng cho mỗi nhà hàng
CartSchema.index(
  { userId: 1, restaurantId: 1 }, 
  { 
    unique: true
  }
);
