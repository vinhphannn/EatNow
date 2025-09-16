import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SupportTicketDocument = HydratedDocument<SupportTicket>;

export enum TicketType {
  ORDER_ISSUE = 'order_issue',
  PAYMENT_ISSUE = 'payment_issue',
  DELIVERY_ISSUE = 'delivery_issue',
  FOOD_QUALITY = 'food_quality',
  RESTAURANT_COMPLAINT = 'restaurant_complaint',
  DRIVER_COMPLAINT = 'driver_complaint',
  TECHNICAL_ISSUE = 'technical_issue',
  ACCOUNT_ISSUE = 'account_issue',
  REFUND_REQUEST = 'refund_request',
  GENERAL_INQUIRY = 'general_inquiry',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_CUSTOMER = 'pending_customer',
  PENDING_RESTAURANT = 'pending_restaurant',
  PENDING_DRIVER = 'pending_driver',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ required: true, unique: true })
  ticketNumber: string; // e.g., "TK-2024-001234"

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId; // User who reported the issue

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigneeId?: Types.ObjectId; // Admin/Support staff assigned

  @Prop({ enum: TicketType, required: true })
  type: TicketType;

  @Prop({ enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String] })
  attachments?: string[]; // URLs of attached files/images

  // Related entities
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Driver' })
  driverId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  // Resolution
  @Prop()
  resolution?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop()
  closedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy?: Types.ObjectId;

  @Prop()
  closeReason?: string;

  // Customer satisfaction
  @Prop({ min: 1, max: 5 })
  rating?: number; // Customer rating of support

  @Prop()
  feedback?: string; // Customer feedback

  @Prop()
  feedbackAt?: Date;

  // SLA tracking
  @Prop()
  firstResponseAt?: Date; // Time to first response

  @Prop()
  resolutionDeadline?: Date; // Expected resolution time

  @Prop()
  escalationAt?: Date; // When escalated to higher priority

  @Prop()
  escalatedBy?: Types.ObjectId;

  @Prop()
  escalationReason?: string;

  // Internal notes
  @Prop()
  internalNotes?: string; // Internal notes for support staff

  @Prop()
  tags?: string[]; // Tags for categorization

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  metadata?: Record<string, any>;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);

// Indexes for efficient queries
SupportTicketSchema.index({ ticketNumber: 1 }, { unique: true });
SupportTicketSchema.index({ reporterId: 1, status: 1 });
SupportTicketSchema.index({ assigneeId: 1, status: 1 });
SupportTicketSchema.index({ type: 1, status: 1 });
SupportTicketSchema.index({ priority: 1, status: 1 });
SupportTicketSchema.index({ orderId: 1 });
SupportTicketSchema.index({ restaurantId: 1 });
SupportTicketSchema.index({ driverId: 1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });
SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ resolutionDeadline: 1 });
SupportTicketSchema.index({ tags: 1 });
