import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  RESTAURANT = 'restaurant',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop({ enum: UserRole, required: true })
  role: UserRole;

  @Prop()
  avatarUrl?: string;

  @Prop({
    type: [
      {
        label: { type: String, required: true },
        addressLine: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        note: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  addresses?: Array<{
    label: string;
    addressLine?: string;
    latitude?: number;
    longitude?: number;
    note?: string;
    isDefault?: boolean;
  }>;

  @Prop({
    type: [String],
    default: ['Nhà', 'Chỗ làm', 'Nhà mẹ chồng'],
  })
  addressLabels?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);


