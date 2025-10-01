import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserRole, UserDocument } from './schemas/user.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
  ) {}

  // Đăng ký tài khoản khách hàng
  async registerCustomer(payload: { email: string; password: string; name: string; phone?: string }) {
    const { email, password, name, phone } = payload;
    if (!email || !password || !name) {
      throw new BadRequestException('Thiếu thông tin bắt buộc');
    }
    const exists = await this.userModel.findOne({ email }).lean();
    if (exists) {
      throw new BadRequestException('Email đã được sử dụng');
    }
    const hash = await bcrypt.hash(password, 10);
    try {
      const created = await this.userModel.create({ email, password: hash, name, phone, role: UserRole.CUSTOMER });
      return { id: created._id, email: created.email, role: created.role };
    } catch (e: any) {
      if (e && (e.code === 11000 || e.message?.includes('duplicate key'))) {
        throw new BadRequestException('Email đã được sử dụng');
      }
      throw e;
    }
  }

  // Đăng ký tài khoản nhà hàng (user role restaurant + bản ghi restaurant)
  async registerRestaurant(payload: { email: string; password: string; name: string; phone?: string; restaurantName: string; description?: string; address?: string }) {
    const { email, password, name, phone, restaurantName, description, address } = payload;
    if (!email || !password || !name || !restaurantName) {
      throw new BadRequestException('Thiếu thông tin bắt buộc');
    }
    const exists = await this.userModel.findOne({ email }).lean();
    if (exists) {
      throw new BadRequestException('Email đã được sử dụng');
    }
    const hash = await bcrypt.hash(password, 10);
    try {
      // Tạo user role restaurant
      const created = await this.userModel.create({ email, password: hash, name, phone, role: UserRole.RESTAURANT });

      // Nếu đã có restaurant cho ownerUserId thì dùng lại, không tạo mới
      let restaurant = await this.restaurantModel.findOne({ ownerUserId: created._id }).lean();
      if (!restaurant) {
        restaurant = await this.restaurantModel.create({
          ownerUserId: created._id,
          name: restaurantName,
          status: 'pending',
          description,
          address,
          joinedAt: new Date(),
          followersCount: 0,
        }) as any;
      }

      // Gán liên kết profile vào user
      await this.userModel.updateOne({ _id: created._id }, { $set: { restaurantProfile: (restaurant as any)._id } });

      return { id: created._id, email: created.email, role: created.role, restaurantId: (restaurant as any)?._id };
    } catch (e: any) {
      if (e && (e.code === 11000 || e.message?.includes('duplicate key'))) {
        throw new BadRequestException('Email đã được sử dụng');
      }
      throw e;
    }
  }

  // Danh sách tất cả người dùng (MongoDB)
  async findAll() {
    const docs = await this.userModel
      .find({}, { email: 1, role: 1, name: 1, phone: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return docs.map((d: any) => ({
      id: d._id,
      email: d.email,
      role: d.role,
      name: d.name,
      phone: d.phone,
      createdAt: d.createdAt,
    }));
  }

  // Lấy 1 người dùng theo email (MongoDB)
  async findByEmail(email: string) {
    const doc = await this.userModel.findOne({ email }).lean();
    if (!doc) {
      throw new NotFoundException('User not found');
    }
    return {
      id: doc._id,
      email: doc.email,
      role: doc.role,
      name: doc.name,
      phone: doc.phone,
      createdAt: (doc as any).createdAt,
    };
  }

  async getProfileById(id: string) {
    try {
      const objectId = new Types.ObjectId(id);
      const doc = await this.userModel.findById(objectId).lean();
      if (!doc) throw new NotFoundException('User not found');
      return {
        id: (doc as any)._id,
        email: (doc as any).email,
        role: (doc as any).role,
        name: (doc as any).name,
        phone: (doc as any).phone,
        avatarUrl: (doc as any).avatarUrl,
        addresses: Array.isArray((doc as any).addresses) ? (doc as any).addresses : [],
        addressLabels: Array.isArray((doc as any).addressLabels) ? (doc as any).addressLabels : ['Nhà', 'Chỗ làm', 'Nhà mẹ chồng'],
        createdAt: (doc as any).createdAt,
        updatedAt: (doc as any).updatedAt,
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async updateProfileById(id: string, payload: any) {
    try {
      const objectId = new Types.ObjectId(id);
      const update: any = {};
      if (typeof payload?.name === 'string') update.name = payload.name;
      if (typeof payload?.phone === 'string') update.phone = payload.phone;
      if (typeof payload?.avatarUrl === 'string') update.avatarUrl = payload.avatarUrl;
      if (Array.isArray(payload?.addresses)) update.addresses = payload.addresses;
      if (Array.isArray(payload?.addressLabels)) update.addressLabels = payload.addressLabels;

      await this.userModel.updateOne({ _id: objectId }, { $set: update });
      return this.getProfileById(id);
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  // Lấy thông tin profile driver (bao gồm thông tin driver)
  async getDriverProfileById(userId: string) {
    try {
      const objectId = new Types.ObjectId(userId);
      
      // Lấy thông tin user
      const user = await this.userModel.findById(objectId).lean();
      if (!user) throw new NotFoundException('User not found');

      // Lấy thông tin driver
      const driver = await this.driverModel.findOne({ userId: objectId }).lean();
      if (!driver) throw new NotFoundException('Driver profile not found');

      return {
        // Thông tin user
        id: (user as any)._id,
        email: (user as any).email,
        role: (user as any).role,
        name: (user as any).name,
        phone: (user as any).phone,
        avatarUrl: (user as any).avatarUrl,
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
        
        // Thông tin driver
        licenseNumber: (driver as any).licenseNumber,
        vehicleType: (driver as any).vehicleType,
        vehicleNumber: (driver as any).vehicleNumber,
        status: (driver as any).status,
        rating: (driver as any).rating || 0,
        ratingCount: (driver as any).ratingCount || 0,
        totalDeliveries: (driver as any).totalDeliveries || 0,
        isAvailable: (driver as any).isAvailable || false,
        location: (driver as any).location,
        lastLocationAt: (driver as any).lastLocationAt,
      };
    } catch (error) {
      throw new NotFoundException('Driver profile not found');
    }
  }
}


