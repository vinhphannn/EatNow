import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TestSearchController } from './test-search.controller';
import { Restaurant, RestaurantSchema } from '../restaurant/schemas/restaurant.schema';
import { Item, ItemSchema } from '../restaurant/schemas/item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
  ],
  controllers: [SearchController, TestSearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
