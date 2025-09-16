import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SearchHistoryDocument = HydratedDocument<SearchHistory>;

export enum SearchType {
  RESTAURANT = 'restaurant',
  ITEM = 'item',
  CATEGORY = 'category',
  GENERAL = 'general',
}

export enum SearchSource {
  SEARCH_BAR = 'search_bar',
  FILTER = 'filter',
  CATEGORY = 'category',
  RECOMMENDATION = 'recommendation',
  AUTOCOMPLETE = 'autocomplete',
  VOICE = 'voice',
  QR_CODE = 'qr_code',
}

export enum ActionType {
  SEARCH = 'search',
  CLICK = 'click',
  VIEW = 'view',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  ORDER = 'order',
  FAVORITE = 'favorite',
  UNFAVORITE = 'unfavorite',
  SHARE = 'share',
  RATE = 'rate',
  REVIEW = 'review',
}

@Schema({ timestamps: true })
export class SearchHistory {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // Optional for anonymous users

  @Prop({ enum: SearchType, required: true })
  type: SearchType;

  @Prop({ enum: SearchSource, required: true })
  source: SearchSource;

  @Prop({ enum: ActionType, required: true })
  action: ActionType;

  @Prop()
  query?: string; // Search query

  @Prop()
  filters?: Record<string, any>; // Applied filters

  @Prop()
  sortBy?: string; // Sort criteria

  @Prop()
  sortOrder?: string; // asc, desc

  // Related entities
  @Prop({ type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Item' })
  itemId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  // Search context
  @Prop()
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @Prop()
  deviceInfo?: {
    userAgent: string;
    platform: string; // ios, android, web
    appVersion?: string;
    deviceId?: string;
  };

  @Prop()
  sessionId?: string;

  @Prop()
  ipAddress?: string;

  // Search results
  @Prop({ default: 0 })
  resultCount: number; // Number of results returned

  @Prop({ default: 0 })
  position: number; // Position of clicked item in results

  @Prop({ default: 0 })
  timeSpent: number; // Time spent on page (seconds)

  @Prop()
  conversionValue?: number; // Value if converted to order

  @Prop()
  conversionAt?: Date; // When converted to order

  @Prop()
  metadata?: Record<string, any>;
}

export const SearchHistorySchema = SchemaFactory.createForClass(SearchHistory);

// Indexes for efficient queries
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ type: 1, action: 1, createdAt: -1 });
SearchHistorySchema.index({ query: 1, createdAt: -1 });
SearchHistorySchema.index({ restaurantId: 1, createdAt: -1 });
SearchHistorySchema.index({ itemId: 1, createdAt: -1 });
SearchHistorySchema.index({ categoryId: 1, createdAt: -1 });
SearchHistorySchema.index({ sessionId: 1, createdAt: -1 });
SearchHistorySchema.index({ ipAddress: 1, createdAt: -1 });
SearchHistorySchema.index({ createdAt: -1 });
// TTL for old search history (keep for 1 year)
SearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
