import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;
export type MessageDocument = HydratedDocument<Message>;

export enum ChatType {
  ORDER_SUPPORT = 'order_support', // Customer ↔ Driver ↔ Restaurant
  CUSTOMER_SUPPORT = 'customer_support', // Customer ↔ Admin
  RESTAURANT_SUPPORT = 'restaurant_support', // Restaurant ↔ Admin
  DRIVER_SUPPORT = 'driver_support', // Driver ↔ Admin
  GENERAL = 'general', // General chat
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  ORDER_UPDATE = 'order_update',
  LOCATION = 'location',
  EMOJI = 'emoji',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ enum: ChatType, required: true })
  type: ChatType;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  participants: Types.ObjectId[]; // All participants in the chat

  @Prop()
  title?: string; // Chat title (e.g., "Order #12345 Support")

  @Prop()
  description?: string; // Chat description

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastMessageBy?: Types.ObjectId;

  @Prop()
  lastMessageAt?: Date;

  @Prop()
  lastMessage?: string; // Preview of last message

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop()
  metadata?: Record<string, any>;
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  receiverIds?: Types.ObjectId[]; // For group chats

  @Prop({ enum: MessageType, required: true })
  type: MessageType;

  @Prop()
  content?: string; // Text content

  @Prop({ type: [String] })
  attachments?: string[]; // URLs of attachments

  @Prop()
  fileMetadata?: Record<string, any>; // File size, type, etc.

  @Prop({ enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  readBy?: Types.ObjectId[]; // Users who have read this message

  @Prop()
  replyTo?: Types.ObjectId; // Message being replied to

  @Prop()
  editedAt?: Date;

  @Prop()
  editedBy?: Types.ObjectId;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop()
  deletedBy?: Types.ObjectId;

  @Prop()
  metadata?: Record<string, any>;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for Chat
ChatSchema.index({ orderId: 1, type: 1 });
ChatSchema.index({ participants: 1, isActive: 1 });
ChatSchema.index({ type: 1, isActive: 1 });
ChatSchema.index({ lastMessageAt: -1 });
ChatSchema.index({ createdBy: 1 });

// Indexes for Message
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ receiverIds: 1, createdAt: -1 });
MessageSchema.index({ type: 1, createdAt: -1 });
MessageSchema.index({ status: 1, createdAt: -1 });
MessageSchema.index({ isDeleted: 1, createdAt: -1 });
