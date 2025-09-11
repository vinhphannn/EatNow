import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Category, CategoryDocument } from '../restaurant/schemas/category.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { Order, OrderDocument } from '../order/schemas/order.schema';

@ApiTags('demo')
@Controller('demo')
export class MongoDemoController {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  @Post('seed-restaurant-with-orders')
  async seed(@Body() body: { name?: string; items?: number }) {
    const rest = await this.restaurantModel.create({ name: body.name || 'Seeded Restaurant', status: 'active' });
    const cat = await this.categoryModel.create({ restaurantId: rest._id, name: 'Popular', position: 1 });
    const n = Math.max(3, Math.min(20, Number(body.items) || 6));
    const items: Types.ObjectId[] = [];
    for (let i = 1; i <= n; i++) {
      const it = await this.itemModel.create({
        restaurantId: rest._id,
        categoryId: cat._id,
        name: `Item ${i}`,
        nameSearch: `item ${i}`,
        price: 10000 + i * 1000,
        type: 'food',
        popularityScore: Math.floor(Math.random() * 100),
      });
      items.push(it._id);
    }
    // Create a few orders
    for (let k = 0; k < 5; k++) {
      const pick = items.slice(0, Math.min(3, items.length)).map((id, idx) => ({
        itemId: id,
        name: `Item ${idx + 1}`,
        price: 10000 + (idx + 1) * 1000,
        quantity: 1,
      }));
      const subtotal = pick.reduce((s, x) => s + x.price * x.quantity, 0);
      await this.orderModel.create({
        code: 'OD' + Date.now() + '-' + k,
        userId: new Types.ObjectId(),
        restaurantId: rest._id,
        status: 'delivered',
        itemsSummary: pick as any,
        subtotal,
        deliveryFee: 15000,
        discount: 0,
        total: subtotal + 15000,
        areaKey: 'q1-hcm',
        paymentMethod: 'cod',
      });
    }
    return { restaurantId: rest._id };
  }
}


