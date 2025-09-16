import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { UserRole } from '../user/schemas/user.schema';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DemoService {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
  ) {}

  // Seed dữ liệu mẫu tối thiểu: 1 nhà hàng, 4 món
  async seed(): Promise<{ ok: boolean; message: string }> {
    try {
      // Create demo restaurant owner
      const existingUser = await this.userModel.findOne({ email: 'demo@restaurant.com' });
      let ownerId;
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const user = await this.userModel.create({
          email: 'demo@restaurant.com',
          password: hashedPassword,
          name: 'Demo Restaurant Owner',
          phone: '0901234567',
          role: UserRole.RESTAURANT,
        });
        ownerId = user._id;
      } else {
        ownerId = existingUser._id;
      }

      // Create demo restaurant
      const existingRestaurant = await this.restaurantModel.findOne({ ownerUserId: ownerId });
      let restaurantId;
      
      if (!existingRestaurant) {
        const restaurant = await this.restaurantModel.create({
          ownerUserId: ownerId,
          name: 'Quán Phở Bò Hàng 8',
          description: 'Phở bò truyền thống, nước dùng đậm đà, thịt bò tươi ngon',
          address: '123 Đường Hàng 8, Quận 1, TP.HCM',
          status: 'active',
          joinedAt: new Date(),
          followersCount: 0,
        });
        restaurantId = restaurant._id;
      } else {
        restaurantId = existingRestaurant._id;
        // Update status to active if it was pending
        if (existingRestaurant.status === 'pending') {
          await this.restaurantModel.updateOne({ _id: restaurantId }, { status: 'active' });
        }
      }

      // Create demo menu items
      const existingItems = await this.itemModel.find({ restaurantId });
      if (existingItems.length === 0) {
        const items = [
          // Phở & Bún
          {
            restaurantId,
            name: 'Phở Bò Tái',
            nameSearch: 'pho bo tai',
            price: 45000,
            type: 'food' as const,
            description: 'Phở bò tái với thịt bò tươi, bánh phở mềm, nước dùng đậm đà',
            isActive: true,
            position: 1,
            popularityScore: 100,
            rating: 4.8,
            reviewCount: 156,
          },
          {
            restaurantId,
            name: 'Phở Bò Chín',
            nameSearch: 'pho bo chin',
            price: 42000,
            type: 'food' as const,
            description: 'Phở bò chín với thịt bò mềm, bánh phở dai, nước dùng ngọt',
            isActive: true,
            position: 2,
            popularityScore: 95,
            rating: 4.6,
            reviewCount: 134,
          },
          {
            restaurantId,
            name: 'Phở Gà',
            nameSearch: 'pho ga',
            price: 40000,
            type: 'food' as const,
            description: 'Phở gà với thịt gà luộc, bánh phở mềm, nước dùng thanh',
            isActive: true,
            position: 3,
            popularityScore: 90,
            rating: 4.4,
            reviewCount: 98,
          },
          {
            restaurantId,
            name: 'Bún Bò Huế',
            nameSearch: 'bun bo hue',
            price: 50000,
            type: 'food' as const,
            description: 'Bún bò Huế cay nồng, thịt bò mềm, bún dai',
            isActive: true,
            position: 4,
            popularityScore: 85,
            rating: 4.7,
            reviewCount: 87,
          },
          {
            restaurantId,
            name: 'Bún Riêu Cua',
            nameSearch: 'bun rieu cua',
            price: 38000,
            type: 'food' as const,
            description: 'Bún riêu cua chua ngọt, cua tươi, đậu hũ',
            isActive: true,
            position: 5,
            popularityScore: 80,
          },
          // Cơm
          {
            restaurantId,
            name: 'Cơm Tấm Sườn Nướng',
            nameSearch: 'com tam suon nuong',
            price: 55000,
            type: 'food' as const,
            description: 'Cơm tấm sườn nướng thơm lừng, bì chả, dưa leo',
            isActive: true,
            position: 6,
            popularityScore: 75,
          },
          {
            restaurantId,
            name: 'Cơm Gà Nướng',
            nameSearch: 'com ga nuong',
            price: 48000,
            type: 'food' as const,
            description: 'Cơm gà nướng mật ong, gà mềm thơm',
            isActive: true,
            position: 7,
            popularityScore: 70,
          },
          {
            restaurantId,
            name: 'Cơm Cháy',
            nameSearch: 'com chay',
            price: 35000,
            type: 'food' as const,
            description: 'Cơm cháy giòn tan, thịt kho tàu',
            isActive: true,
            position: 8,
            popularityScore: 65,
          },
          // Món nướng
          {
            restaurantId,
            name: 'Thịt Nướng',
            nameSearch: 'thit nuong',
            price: 60000,
            type: 'food' as const,
            description: 'Thịt nướng BBQ, thịt bò tươi',
            isActive: true,
            position: 9,
            popularityScore: 60,
          },
          {
            restaurantId,
            name: 'Tôm Nướng',
            nameSearch: 'tom nuong',
            price: 70000,
            type: 'food' as const,
            description: 'Tôm nướng muối ớt, tôm tươi to',
            isActive: true,
            position: 10,
            popularityScore: 55,
          },
          // Món chiên
          {
            restaurantId,
            name: 'Gà Rán',
            nameSearch: 'ga ran',
            price: 45000,
            type: 'food' as const,
            description: 'Gà rán giòn, thịt mềm bên trong',
            isActive: true,
            position: 11,
            popularityScore: 50,
          },
          {
            restaurantId,
            name: 'Khoai Tây Chiên',
            nameSearch: 'khoai tay chien',
            price: 25000,
            type: 'food' as const,
            description: 'Khoai tây chiên giòn, muối tây',
            isActive: true,
            position: 12,
            popularityScore: 45,
          },
          // Đồ uống
          {
            restaurantId,
            name: 'Trà Đá',
            nameSearch: 'tra da',
            price: 5000,
            type: 'drink' as const,
            description: 'Trà đá mát lạnh, giải khát',
            isActive: true,
            position: 13,
            popularityScore: 40,
          },
          {
            restaurantId,
            name: 'Nước Ngọt',
            nameSearch: 'nuoc ngot',
            price: 15000,
            type: 'drink' as const,
            description: 'Coca, Pepsi, 7Up, Sprite',
            isActive: true,
            position: 14,
            popularityScore: 35,
          },
          {
            restaurantId,
            name: 'Trà Sữa',
            nameSearch: 'tra sua',
            price: 25000,
            type: 'drink' as const,
            description: 'Trà sữa thơm ngon, trân châu',
            isActive: true,
            position: 15,
            popularityScore: 30,
          },
          {
            restaurantId,
            name: 'Cà Phê Đen',
            nameSearch: 'ca phe den',
            price: 12000,
            type: 'drink' as const,
            description: 'Cà phê đen đậm đà, thơm nồng',
            isActive: true,
            position: 16,
            popularityScore: 25,
          },
          {
            restaurantId,
            name: 'Sinh Tố Bơ',
            nameSearch: 'sinh to bo',
            price: 30000,
            type: 'drink' as const,
            description: 'Sinh tố bơ béo ngậy, sữa đặc',
            isActive: true,
            position: 17,
            popularityScore: 20,
          },
          // Món chay
          {
            restaurantId,
            name: 'Cơm Chay',
            nameSearch: 'com chay',
            price: 30000,
            type: 'food' as const,
            description: 'Cơm chay thanh đạm, rau củ tươi',
            isActive: true,
            position: 18,
            popularityScore: 15,
          },
          {
            restaurantId,
            name: 'Bún Chay',
            nameSearch: 'bun chay',
            price: 25000,
            type: 'food' as const,
            description: 'Bún chay nước dùng chay, đậu hũ',
            isActive: true,
            position: 19,
            popularityScore: 10,
          },
          // Món lẩu
          {
            restaurantId,
            name: 'Lẩu Thái',
            nameSearch: 'lau thai',
            price: 120000,
            type: 'food' as const,
            description: 'Lẩu Thái cay nồng, hải sản tươi',
            isActive: true,
            position: 20,
            popularityScore: 5,
          },
        ];

        await this.itemModel.insertMany(items);
      }

      return { 
        ok: true, 
        message: 'Demo data seeded successfully! Restaurant: Quán Phở Bò Hàng 8 with 20 menu items.' 
      };
    } catch (error) {
      console.error('Seed error:', error);
      return { 
        ok: false, 
        message: `Seed failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Lấy danh sách nhà hàng + vài món nổi bật cho demo
  async getRestaurantsWithMenu(): Promise<any[]> {
    try {
      const restaurants = await this.restaurantModel.find({ status: 'active' }).lean();
      const result = [];

      for (const restaurant of restaurants) {
        const items = await this.itemModel
          .find({ restaurantId: restaurant._id, isActive: true })
          .sort({ popularityScore: -1, position: 1 })
          .limit(6)
          .lean();

        result.push({
          restaurant_id: String(restaurant._id),
          restaurant_name: restaurant.name,
          items: items.map(item => ({
            id: String(item._id),
            name: item.name,
            price: item.price,
            type: item.type,
            description: item.description,
          })),
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting restaurants with menu:', error);
      return [];
    }
  }

  // Tạo demo driver để test
  async createDemoDriver(): Promise<{ ok: boolean; message: string; driver?: any }> {
    try {
      // Check if demo driver already exists
      const existingUser = await this.userModel.findOne({ email: 'demo@driver.com' });
      let driverUserId;
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const user = await this.userModel.create({
          email: 'demo@driver.com',
          password: hashedPassword,
          name: 'Demo Driver',
          phone: '0901234568',
          role: UserRole.DRIVER,
        });
        driverUserId = user._id;
      } else {
        driverUserId = existingUser._id;
      }

      // Check if driver record already exists
      const existingDriver = await this.driverModel.findOne({ userId: driverUserId });
      let driver;
      
      if (!existingDriver) {
        driver = await this.driverModel.create({
          userId: driverUserId,
          name: 'Demo Driver',
          phone: '0901234568',
          email: 'demo@driver.com',
          licenseNumber: 'A123456789',
          vehicleType: 'motorcycle',
          vehicleNumber: '51A-12345',
          status: 'inactive',
          isAvailable: false,
          location: [106.7009, 10.7769], // TP.HCM coordinates
          locationType: 'Point',
          lastLocationAt: new Date(),
        });
      } else {
        driver = existingDriver;
      }

      return {
        ok: true,
        message: 'Demo driver created successfully',
        driver: {
          id: driver._id,
          userId: driver.userId,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          vehicleType: driver.vehicleType,
          vehicleNumber: driver.vehicleNumber,
        }
      };
    } catch (error) {
      console.error('Error creating demo driver:', error);
      return {
        ok: false,
        message: 'Failed to create demo driver: ' + error.message
      };
    }
  }
}


