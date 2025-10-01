import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion, PromotionDocument } from '../schemas/promotion.schema';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionController {
  constructor(
    @InjectModel(Promotion.name) private readonly promotionModel: Model<PromotionDocument>,
  ) {}

  // Public endpoint: lấy tất cả promotions active cho customer
  @Get('public')
  async findAllPublic(@Query('limit') limit?: number) {
    const limitCount = limit ? parseInt(limit.toString()) : 10;
    
    const now = new Date();
    const promotions = await this.promotionModel
      .find({
        status: 'active',
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      }, {
        name: 1,
        description: 1,
        code: 1,
        type: 1,
        value: 1,
        maxDiscountAmount: 1,
        minOrderAmount: 1,
        endDate: 1,
        imageUrl: 1
      })
      .sort({ createdAt: -1 })
      .limit(limitCount)
      .lean();
    
    // Tạo promotions mặc định nếu không có
    const defaultPromotions = [
      {
        id: 'welcome-20',
        name: 'Chào mừng khách hàng mới',
        description: 'Giảm 20% cho đơn hàng đầu tiên',
        code: 'WELCOME20',
        type: 'percentage',
        value: 20,
        maxDiscountAmount: 50000,
        minOrderAmount: 100000,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400'
      },
      {
        id: 'freeship-50k',
        name: 'Miễn phí ship',
        description: 'Miễn phí giao hàng cho đơn từ 50k',
        code: 'FREESHIP50K',
        type: 'free_delivery',
        value: 0,
        minOrderAmount: 50000,
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'
      }
    ];

    if (promotions.length === 0) {
      return defaultPromotions;
    }

    return promotions.map((promo: any) => ({
      id: String(promo._id),
      name: promo.name || 'Khuyến mãi đặc biệt',
      description: promo.description || 'Khuyến mãi hấp dẫn',
      code: promo.code || 'PROMO',
      type: promo.type || 'percentage',
      value: promo.value || 10,
      maxDiscountAmount: promo.maxDiscountAmount || null,
      minOrderAmount: promo.minOrderAmount || 0,
      endDate: promo.endDate,
      imageUrl: promo.imageUrl || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400'
    }));
  }
}
