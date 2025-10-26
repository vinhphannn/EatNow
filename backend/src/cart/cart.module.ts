import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './schemas/cart.schema';
import { Item, ItemSchema } from '../restaurant/schemas/item.schema';
import { Restaurant, RestaurantSchema } from '../restaurant/schemas/restaurant.schema';
import { ItemOptionSeparate, ItemOptionSeparateSchema } from '../restaurant/schemas/item-option-separate.schema';
import { OptionChoiceSeparate, OptionChoiceSeparateSchema } from '../restaurant/schemas/option-choice-separate.schema';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ItemOptionSeparateService } from '../restaurant/item-option-separate.service';
import { OptionChoiceSeparateService } from '../restaurant/option-choice-separate.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: ItemOptionSeparate.name, schema: ItemOptionSeparateSchema },
      { name: OptionChoiceSeparate.name, schema: OptionChoiceSeparateSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService, ItemOptionSeparateService, OptionChoiceSeparateService],
  exports: [CartService],
})
export class CartModule {}