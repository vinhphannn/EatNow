import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from '../../../driver/schemas/driver.schema';
import { User, UserDocument } from '../../../user/schemas/user.schema';

@Injectable()
export class AdminDriversService {
  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async list({ page = 1, limit = 20, q, status, sort }: any) {
    // Base on Driver docs so drivers show even if user doesn't have specific role flags
    const driverFilter: any = {};
    if (status) driverFilter.status = status;

    // If searching by q, first find matching users and filter drivers by those userIds
    let userIdAllowList: Types.ObjectId[] | null = null;
    if (q) {
      const matchedUsers = await this.userModel.find({
        $or: [
          { email: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
        ],
      }, { _id: 1 }).lean();
      userIdAllowList = matchedUsers.map((u: any) => new Types.ObjectId(String(u._id)));
      if (userIdAllowList.length > 0) {
        driverFilter.userId = { $in: userIdAllowList };
      } else {
        // No matches, short-circuit
        return { data: [], page: Number(page), limit: Number(limit), total: 0 };
      }
    }

    const sortSpec = (() => {
      if (!sort) return { createdAt: -1 } as any;
      const [field, dir] = String(sort).split(':');
      return { [field]: dir === 'desc' ? -1 : 1 } as any;
    })();

    // Lấy TẤT CẢ thông tin driver từ database
    const [drivers, total] = await Promise.all([
      this.driverModel
        .find(driverFilter)
        .sort(sortSpec)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      this.driverModel.countDocuments(driverFilter),
    ]);

    const userIds = Array.from(new Set(drivers.map((d: any) => String(d.userId)).filter(Boolean))).map((id) => new Types.ObjectId(id));
    const users = userIds.length
      ? await this.userModel
          .find({ _id: { $in: userIds } }, { name: 1, email: 1, phone: 1, isActive: 1, lastLoginAt: 1 })
          .lean()
      : [];
    const userMap = new Map(users.map((u: any) => [String(u._id), u]));

    const data = drivers.map((d: any) => {
      const u = d.userId ? userMap.get(String(d.userId)) : null;
      return {
        // Thông tin cơ bản
        id: String(d._id),
        userId: d.userId ? String(d.userId) : undefined,
        name: u?.name || u?.email || 'N/A',
        phone: u?.phone,
        email: u?.email,
        isActive: u?.isActive,
        lastLoginAt: u?.lastLoginAt,
        
        // Trạng thái làm việc
        status: d.status,
        deliveryStatus: d.deliveryStatus,
        
        // Thông tin ban
        banInfo: d.banInfo ? {
          reason: d.banInfo.reason,
          until: d.banInfo.until,
          bannedBy: d.banInfo.bannedBy,
          bannedAt: d.banInfo.bannedAt
        } : null,
        
        // Vị trí GPS
        location: d.location ? {
          latitude: d.location[1],
          longitude: d.location[0]
        } : null,
        lastLocationAt: d.lastLocationAt,
        
        // Đơn hàng hiện tại
        currentOrderId: d.currentOrderId ? String(d.currentOrderId) : null,
        currentOrderStartedAt: d.currentOrderStartedAt,
        
        // Chỉ số hiệu suất
        ordersCompleted: d.ordersCompleted || 0,
        ordersRejected: d.ordersRejected || 0,
        ordersSkipped: d.ordersSkipped || 0,
        rating: d.rating || 0,
        ratingCount: d.ratingCount || 0,
        onTimeDeliveries: d.onTimeDeliveries || 0,
        lateDeliveries: d.lateDeliveries || 0,
        
        // Thông tin phương tiện
        vehicleType: d.vehicleType,
        licensePlate: d.licensePlate,
        
        // Thông tin ngân hàng
        bankAccount: d.bankAccount,
        bankName: d.bankName,
        
        // Thống kê chi tiết
        totalDeliveries: d.totalDeliveries || 0,
        averageDeliveryTime: d.averageDeliveryTime || 0,
        performanceScore: d.performanceScore || 0,
        
        // Theo dõi tải công việc
        activeOrdersCount: d.activeOrdersCount || 0,
        maxConcurrentOrders: d.maxConcurrentOrders || 1,
        
        // Hiệu suất khoảng cách
        averageDistancePerOrder: d.averageDistancePerOrder || 0,
        totalDistanceTraveled: d.totalDistanceTraveled || 0,
        
        // Chế độ tự động
        isAuto: !!d.isAuto,
        autoMeta: d.autoMeta,
        
        // Ví tiền
        walletBalance: d.walletBalance || 0,
        
        // Timestamps
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      };
    });

    return { data, page: Number(page), limit: Number(limit), total };
  }

  async findOne(id: string) {
    const d: any = await this.driverModel.findById(id).lean();
    if (!d) return null;
    const u = d.userId ? await this.userModel.findById(d.userId, { email: 1, name: 1, phone: 1, isActive: 1, lastLoginAt: 1 }).lean() : null;
    
    return {
      // Thông tin cơ bản
      id: String(d._id),
      userId: d.userId ? String(d.userId) : undefined,
      name: u?.name || u?.email || 'N/A',
      phone: u?.phone,
      email: u?.email,
      isActive: u?.isActive,
      lastLoginAt: u?.lastLoginAt,
      
      // Trạng thái làm việc
      status: d.status,
      deliveryStatus: d.deliveryStatus,
      
      // Thông tin ban
      banInfo: d.banInfo ? {
        reason: d.banInfo.reason,
        until: d.banInfo.until,
        bannedBy: d.banInfo.bannedBy,
        bannedAt: d.banInfo.bannedAt
      } : null,
      
      // Vị trí GPS
      location: d.location ? {
        latitude: d.location[1],
        longitude: d.location[0]
      } : null,
      lastLocationAt: d.lastLocationAt,
      
      // Đơn hàng hiện tại
      currentOrderId: d.currentOrderId ? String(d.currentOrderId) : null,
      currentOrderStartedAt: d.currentOrderStartedAt,
      
      // Chỉ số hiệu suất
      ordersCompleted: d.ordersCompleted || 0,
      ordersRejected: d.ordersRejected || 0,
      ordersSkipped: d.ordersSkipped || 0,
      rating: d.rating || 0,
      ratingCount: d.ratingCount || 0,
      onTimeDeliveries: d.onTimeDeliveries || 0,
      lateDeliveries: d.lateDeliveries || 0,
      
      // Thông tin phương tiện
      vehicleType: d.vehicleType,
      licensePlate: d.licensePlate,
      
      // Thông tin ngân hàng
      bankAccount: d.bankAccount,
      bankName: d.bankName,
      
      // Thống kê chi tiết
      totalDeliveries: d.totalDeliveries || 0,
      averageDeliveryTime: d.averageDeliveryTime || 0,
      performanceScore: d.performanceScore || 0,
      
      // Theo dõi tải công việc
      activeOrdersCount: d.activeOrdersCount || 0,
      maxConcurrentOrders: d.maxConcurrentOrders || 1,
      
      // Hiệu suất khoảng cách
      averageDistancePerOrder: d.averageDistancePerOrder || 0,
      totalDistanceTraveled: d.totalDistanceTraveled || 0,
      
      // Chế độ tự động
      isAuto: !!d.isAuto,
      autoMeta: d.autoMeta,
      
      // Ví tiền
      walletBalance: d.walletBalance || 0,
      
      // Timestamps
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      
      // User info
      user: u ? { 
        id: String(u._id), 
        email: u.email, 
        name: u.name, 
        phone: u.phone, 
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt
      } : null,
    } as any;
  }

  async update(id: string, payload: { status?: string; isAuto?: boolean }) {
    const d = await this.driverModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) return null;
    return { id: String(d._id), status: d.status, isAuto: !!d.isAuto } as any;
  }

  /**
   * Lấy thống kê tổng quan về tài xế
   */
  async getOverviewStats() {
    try {
      // Thống kê theo trạng thái
      const statusStats = await this.driverModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Thống kê theo delivery status
      const deliveryStatusStats = await this.driverModel.aggregate([
        {
          $group: {
            _id: '$deliveryStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      // Thống kê hiệu suất
      const performanceStats = await this.driverModel.aggregate([
        {
          $group: {
            _id: null,
            totalDrivers: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            avgOrdersCompleted: { $avg: '$ordersCompleted' },
            avgPerformanceScore: { $avg: '$performanceScore' },
            totalWalletBalance: { $sum: '$walletBalance' },
            totalDistanceTraveled: { $sum: '$totalDistanceTraveled' }
          }
        }
      ]);

      // Top tài xế theo rating
      const topRatedDrivers = await this.driverModel
        .find({ rating: { $gt: 0 } })
        .sort({ rating: -1 })
        .limit(5)
        .select('userId rating ordersCompleted totalDeliveries')
        .lean();

      // Top tài xế theo số đơn hoàn thành
      const topPerformers = await this.driverModel
        .find({ ordersCompleted: { $gt: 0 } })
        .sort({ ordersCompleted: -1 })
        .limit(5)
        .select('userId ordersCompleted rating totalDeliveries')
        .lean();

      // Tài xế có vấn đề (rating thấp hoặc nhiều đơn bị từ chối)
      const problematicDrivers = await this.driverModel
        .find({
          $or: [
            { rating: { $lt: 3.0, $gt: 0 } },
            { ordersRejected: { $gt: 5 } },
            { banInfo: { $exists: true, $ne: null } }
          ]
        })
        .select('userId rating ordersRejected banInfo')
        .lean();

      // Lấy thông tin user cho top drivers
      const userIds = [
        ...topRatedDrivers.map(d => d.userId),
        ...topPerformers.map(d => d.userId),
        ...problematicDrivers.map(d => d.userId)
      ].filter(Boolean);

      const users = userIds.length > 0 
        ? await this.userModel.find({ _id: { $in: userIds } }, { name: 1, email: 1, phone: 1 }).lean()
        : [];
      const userMap = new Map(users.map((u: any) => [String(u._id), u]));

      return {
        success: true,
        data: {
          // Thống kê cơ bản
          statusStats: statusStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          
          deliveryStatusStats: deliveryStatusStats.reduce((acc, stat) => {
            acc[stat._id || 'null'] = stat.count;
            return acc;
          }, {}),
          
          // Thống kê hiệu suất tổng quan
          performance: performanceStats[0] || {
            totalDrivers: 0,
            avgRating: 0,
            avgOrdersCompleted: 0,
            avgPerformanceScore: 0,
            totalWalletBalance: 0,
            totalDistanceTraveled: 0
          },
          
          // Top tài xế
          topRatedDrivers: topRatedDrivers.map(driver => {
            const user = userMap.get(String(driver.userId));
            return {
              id: String(driver._id),
              name: user?.name || user?.email || 'N/A',
              phone: user?.phone,
              rating: driver.rating,
              ordersCompleted: driver.ordersCompleted,
              totalDeliveries: driver.totalDeliveries
            };
          }),
          
          topPerformers: topPerformers.map(driver => {
            const user = userMap.get(String(driver.userId));
            return {
              id: String(driver._id),
              name: user?.name || user?.email || 'N/A',
              phone: user?.phone,
              ordersCompleted: driver.ordersCompleted,
              rating: driver.rating,
              totalDeliveries: driver.totalDeliveries
            };
          }),
          
          // Tài xế có vấn đề
          problematicDrivers: problematicDrivers.map(driver => {
            const user = userMap.get(String(driver.userId));
            return {
              id: String(driver._id),
              name: user?.name || user?.email || 'N/A',
              phone: user?.phone,
              rating: driver.rating,
              ordersRejected: driver.ordersRejected,
              isBanned: !!driver.banInfo,
              banReason: driver.banInfo?.reason
            };
          })
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}


