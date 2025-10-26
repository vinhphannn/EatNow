import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Image, ImageSchema } from './schemas/image.schema';
import { Promotion, PromotionSchema } from './schemas/promotion.schema';
import { GlobalCategory, GlobalCategorySchema } from './schemas/global-category.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { SearchHistory, SearchHistorySchema } from './schemas/search-history.schema';
import { ImageService } from './services/image.service';
import { ImageController } from './controllers/image.controller';
import { PromotionController } from './controllers/promotion.controller';
import { GlobalCategoryController } from './controllers/global-category.controller';
import { ReviewController } from './controllers/review.controller';
import { FavoriteController } from './controllers/favorite.controller';
import { DistanceService } from './services/distance.service';
import { RedisService } from './services/redis.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Image.name, schema: ImageSchema },
      { name: Promotion.name, schema: PromotionSchema },
      { name: GlobalCategory.name, schema: GlobalCategorySchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: SearchHistory.name, schema: SearchHistorySchema },
    ]),
  ],
  controllers: [ImageController, PromotionController, GlobalCategoryController, ReviewController, FavoriteController],
  providers: [ImageService, DistanceService, RedisService],
  exports: [ImageService, DistanceService, RedisService],
})
export class CommonModule {}
