import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Index } from 'typeorm';

export type DriverDocument = HydratedDocument<Driver>;

@Schema({ timestamps: true })
export class Driver {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: any;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop({ default: 'inactive' })
  status: string; // inactive | active | suspended

}

export const DriverSchema = SchemaFactory.createForClass(Driver);


