import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RestaurantAdminLogDocument = HydratedDocument<RestaurantAdminLog>;

@Schema({ timestamps: true })
export class RestaurantAdminLog {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId: any;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: any;

  @Prop({ enum: ['SUSPEND','BAN','NOTE','WARN','ACTIVATE','UNLOCK'] })
  action: 'SUSPEND' | 'BAN' | 'NOTE' | 'WARN' | 'ACTIVATE' | 'UNLOCK';

  @Prop()
  reason?: string;
}

export const RestaurantAdminLogSchema = SchemaFactory.createForClass(RestaurantAdminLog);


