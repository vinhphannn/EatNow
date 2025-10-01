import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SearchHistoryDocument = HydratedDocument<SearchHistory>;

export enum SearchType {
  RESTAURANT = 'restaurant',
  ITEM = 'item',
  CATEGORY = 'category',
  GENERAL = 'general',
}

@Schema({ timestamps: true })
export class SearchHistory {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: any; // Can be null for anonymous searches

  @Prop({ required: true, trim: true })
  query: string;

  @Prop({ enum: SearchType, default: SearchType.GENERAL })
  type: SearchType;

  @Prop({ trim: true })
  location?: string; // User's location when searching

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ default: 0 })
  resultCount: number;

  @Prop({ default: false })
  hasResults: boolean;

  @Prop({ default: 0 })
  clickCount: number; // How many results were clicked

  @Prop({ type: [String] })
  clickedResults?: string[]; // IDs of clicked results

  @Prop({ default: 0 })
  conversionCount: number; // How many resulted in orders

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  sessionId?: string;

  // Analytics
  @Prop({ default: 0 })
  searchRank: number; // Position in search results

  @Prop({ default: false })
  isSuccessful: boolean; // Did it lead to a successful action

  @Prop({ default: 0 })
  timeSpent: number; // Time spent on search results (seconds)

  @Prop()
  referrer?: string; // Where the search came from

  // Filters used
  @Prop({ type: Object })
  filters?: {
    category?: string;
    priceRange?: { min: number; max: number };
    rating?: number;
    distance?: number;
    deliveryTime?: string;
    cuisine?: string[];
    features?: string[];
  };

  // Device and platform info
  @Prop()
  deviceType?: string; // mobile, desktop, tablet

  @Prop()
  platform?: string; // web, ios, android

  @Prop()
  appVersion?: string;
}

export const SearchHistorySchema = SchemaFactory.createForClass(SearchHistory);

// Indexes for efficient queries
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ query: 1, type: 1 });
SearchHistorySchema.index({ userId: 1, query: 1, type: 1 });
SearchHistorySchema.index({ createdAt: -1 });
SearchHistorySchema.index({ hasResults: 1, createdAt: -1 });
SearchHistorySchema.index({ isSuccessful: 1, createdAt: -1 });
SearchHistorySchema.index({ sessionId: 1 });
SearchHistorySchema.index({ type: 1, createdAt: -1 });

// TTL index to auto-delete old records (keep for 1 year)
SearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });