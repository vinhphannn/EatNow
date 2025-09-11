import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RestaurantDocument = HydratedDocument<Restaurant>;

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerUserId: any;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'pending' })
  status: string; // pending | active | suspended | closed

  @Prop({ default: Date.now })
  joinedAt: Date;

  @Prop({ default: 0 })
  followersCount: number;

  @Prop()
  description?: string;

  @Prop()
  address?: string;

  @Prop()
  openingHours?: string; // e.g. "Mon-Sun 8:00-22:00"

  // Thời gian mở/đóng cửa (HH:mm)
  @Prop()
  openTime?: string;

  @Prop()
  closeTime?: string;

  // Các ngày mở cửa trong tuần (0-6, 0=CN)
  @Prop({ type: [Number], default: undefined })
  openDays?: number[];

  // Tọa độ vị trí quán
  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);


