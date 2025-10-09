import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model as MModel } from 'mongoose';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { FilterQuery, Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Item, ItemDocument } from './schemas/item.schema';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  // Restaurants
  async createRestaurant(payload: { ownerUserId?: any; name: string; description?: string; address?: string; openingHours?: string; openTime?: string; closeTime?: string; openDays?: number[]; latitude?: number; longitude?: number }) {
    const ownerUserId = payload.ownerUserId ? (Types.ObjectId.isValid(String(payload.ownerUserId)) ? new Types.ObjectId(String(payload.ownerUserId)) : payload.ownerUserId) : undefined;
    
    const doc = await this.restaurantModel.create({
      ownerUserId: ownerUserId,
      name: payload.name,
      description: payload.description,
      address: payload.address,
      openingHours: payload.openingHours,
      openTime: payload.openTime,
      closeTime: payload.closeTime,
      openDays: payload.openDays,
      latitude: payload.latitude,
      longitude: payload.longitude,
      status: 'active',
    });
    return { id: String(doc._id), name: doc.name, status: doc.status, ownerUserId: doc.ownerUserId };
  }

  async findAllRestaurants(filter?: { ownerUserId?: any; status?: string }) {
    const q: FilterQuery<RestaurantDocument> = {};
    if (filter?.ownerUserId) {
      const id = String(filter.ownerUserId);
      (q as any).ownerUserId = Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;
    }
    if (filter?.status) (q as any).status = filter.status;
    const docs = await this.restaurantModel
      .find(q, { name: 1, status: 1, ownerUserId: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return docs.map((d: any) => ({ id: String(d._id), name: d.name, status: d.status, ownerUserId: d.ownerUserId, createdAt: d.createdAt }));
  }

  async findAllPublicRestaurants(options?: { limit?: number | string; skip?: number | string; category?: string }) {
    const limit = Math.max(0, Number(options?.limit ?? 20));
    const skip = Math.max(0, Number(options?.skip ?? 0));
    
    const filter: any = { status: 'active' };
    if (options?.category) {
      filter.category = { $regex: options.category, $options: 'i' };
    }

    const docs = await this.restaurantModel
      .find(filter, {
        name: 1,
        description: 1,
        address: 1,
        imageUrl: 1,
        rating: 1,
        deliveryTime: 1,
        category: 1,
        isOpen: 1,
        createdAt: 1
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    // Không trả demo khi rỗng; để FE xử lý empty state
    return docs.map((d: any) => ({
      id: String(d._id),
      name: d.name || 'Chưa thiết lập tên',
      description: d.description || 'Chưa có mô tả',
      address: d.address || 'Chưa thiết lập địa chỉ',
      imageUrl: d.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      rating: d.rating || 0,
      deliveryTime: d.deliveryTime || '30-45 phút',
      category: d.category || 'Nhà hàng',
      isOpen: d.isOpen !== undefined ? d.isOpen : true,
      createdAt: d.createdAt
    }));
  }

  async findAllPublicCategories() {
    // Sử dụng GlobalCategory thay vì Category riêng lẻ
    const globalCategoryModel = this.restaurantModel.db.model('GlobalCategory');
    
    const categories = await globalCategoryModel
      .find({ isActive: true, isVisible: true }, { 
        name: 1, 
        position: 1, 
        icon: 1, 
        slug: 1, 
        isFeatured: 1,
        restaurantCount: 1,
        popularityScore: 1 
      })
      .sort({ position: 1, popularityScore: -1 })
      .lean();

    return categories.map((cat: any) => ({
      id: String(cat._id),
      name: cat.name,
      position: cat.position,
      icon: cat.icon,
      slug: cat.slug,
      isFeatured: cat.isFeatured,
      restaurantCount: cat.restaurantCount,
      popularityScore: cat.popularityScore,
    }));
  }

  async findOneByOwnerUserId(ownerUserId: any) {
    const id = String(ownerUserId);
    const d = await this.restaurantModel.findOne({ ownerUserId: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id }).lean();
    if (!d) return null;
    return { id: String(d._id), name: d.name, status: d.status, ownerUserId: (d as any).ownerUserId, createdAt: (d as any).createdAt, description: (d as any).description, address: (d as any).address, openingHours: (d as any).openingHours, openTime: (d as any).openTime, closeTime: (d as any).closeTime, openDays: (d as any).openDays, latitude: (d as any).latitude, longitude: (d as any).longitude };
  }

  async getRestaurant(id: string) {
    const d = await this.restaurantModel.findById(id).lean();
    if (!d) throw new NotFoundException('Restaurant not found');
    return {
      id: String(d._id),
      name: d.name,
      status: d.status,
      ownerUserId: (d as any).ownerUserId,
      createdAt: (d as any).createdAt,
      description: (d as any).description,
      address: (d as any).address,
      openingHours: (d as any).openingHours,
      openTime: (d as any).openTime,
      closeTime: (d as any).closeTime,
      openDays: (d as any).openDays,
      latitude: (d as any).latitude,
      longitude: (d as any).longitude,
    };
  }

  async getWalletForOwner(ownerUserId: string) {
    const r = await this.restaurantModel.findOne({ ownerUserId: new Types.ObjectId(ownerUserId) }).lean();
    if (!r) return { walletBalance: 0, totalRevenue: 0, commissionRate: 0.15, recentOrders: [] };
    const recentOrders = await this.orderModel
      .find({ restaurantId: (r as any)._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    const mapped = recentOrders.map((o: any) => ({
      id: String(o._id),
      status: o.status,
      total: o.total,
      deliveryFee: o.deliveryFee,
      netToRestaurant: Math.max(0, Math.round(Number(o.total || 0) - Number(o.total || 0) * Number((r as any).commissionRate ?? 0.15))),
      createdAt: o.createdAt,
    }));
    return {
      walletBalance: (r as any).walletBalance || 0,
      totalRevenue: (r as any).totalRevenue || 0,
      commissionRate: (r as any).commissionRate ?? 0.15,
      recentOrders: mapped,
    };
  }

  async updateRestaurant(id: string, payload: { name?: string; status?: string; banReason?: string; description?: string; address?: string; openingHours?: string; openTime?: string; closeTime?: string; openDays?: number[]; latitude?: number; longitude?: number }) {
    const d = await this.restaurantModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) throw new NotFoundException('Restaurant not found');
    return { id: String(d._id), name: d.name, status: d.status, banReason: (d as any).banReason, ownerUserId: (d as any).ownerUserId, description: (d as any).description, address: (d as any).address, openingHours: (d as any).openingHours, openTime: (d as any).openTime, closeTime: (d as any).closeTime, openDays: (d as any).openDays, latitude: (d as any).latitude, longitude: (d as any).longitude };
  }

  async deleteRestaurant(id: string) {
    await this.restaurantModel.findByIdAndDelete(id);
    await this.categoryModel.deleteMany({ restaurantId: id });
    await this.itemModel.deleteMany({ restaurantId: id });
    return { ok: true };
  }

  // Categories
  async createCategory(restaurantId: string, payload: { name: string; position?: number }) {
    const rest = await this.restaurantModel.exists({ _id: restaurantId });
    if (!rest) throw new NotFoundException('Restaurant not found');
    const doc = await this.categoryModel.create({ restaurantId, name: payload.name, position: payload.position ?? 0 });
    return { id: doc._id, restaurantId: doc.restaurantId, name: doc.name, position: doc.position };
  }

  async listCategories(restaurantId: string) {
    const docs = await this.categoryModel.find({ restaurantId }, { name: 1, position: 1, createdAt: 1 }).sort({ position: 1, createdAt: 1 }).lean();
    return docs.map((d: any) => ({ id: d._id, restaurantId: d.restaurantId, name: d.name, position: d.position, createdAt: d.createdAt }));
  }

  async updateCategory(id: string, payload: { name?: string; position?: number }) {
    const d = await this.categoryModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) throw new NotFoundException('Category not found');
    return { id: d._id, restaurantId: (d as any).restaurantId, name: d.name, position: d.position };
  }

  async deleteCategory(id: string) {
    await this.categoryModel.findByIdAndDelete(id);
    await this.itemModel.updateMany({ categoryId: id }, { $unset: { categoryId: 1 } });
    return { ok: true };
  }

  // Items
  async createItem(restaurantId: string, payload: { name: string; price: number; type: 'food'|'drink'; categoryId?: string; description?: string; imageUrl?: string; isActive?: boolean; position?: number; quantityRemaining?: number }) {
    const rest = await this.restaurantModel.exists({ _id: restaurantId });
    if (!rest) throw new NotFoundException('Restaurant not found');
    const doc = await this.itemModel.create({ restaurantId, ...payload });
    return { id: doc._id };
  }

  async listItems(restaurantId: string, filter?: { type?: 'food'|'drink'; categoryId?: string; isActive?: string; sortBy?: 'position'|'createdAt'|'price'; order?: 'asc'|'desc'; limit?: string }) {
    const q: any = { restaurantId };
    if (filter?.type) q.type = filter.type;
    if (filter?.categoryId) q.categoryId = filter.categoryId;
    if (typeof filter?.isActive !== 'undefined') {
      if (filter.isActive === 'true' || filter.isActive === '1') q.isActive = true;
      else if (filter.isActive === 'false' || filter.isActive === '0') q.isActive = false;
    }
    const sort: any = {};
    const sortField = filter?.sortBy || 'position';
    const sortOrder = (filter?.order || 'asc') === 'asc' ? 1 : -1;
    sort[sortField] = sortOrder;
    if (sortField !== 'createdAt') sort['createdAt'] = 1;
    let qy = this.itemModel
      .find(q, { name: 1, price: 1, type: 1, isActive: 1, categoryId: 1, position: 1, createdAt: 1, quantityRemaining: 1, imageUrl: 1, imageId: 1, description: 1, rating: 1, reviewCount: 1, popularityScore: 1 })
      .sort(sort);
    // Apply limit only when provided and valid (>0). Do not force default 1.
    const parsedLimit = Number(filter?.limit);
    const hasValidLimit = Number.isFinite(parsedLimit) && parsedLimit > 0;
    if (hasValidLimit) {
      const n = Math.min(100, Math.floor(parsedLimit));
      qy = qy.limit(n);
    }
    const docs = await qy.lean();
    return docs.map((d: any) => ({ 
      id: d._id, 
      name: d.name, 
      price: d.price, 
      type: d.type, 
      isActive: d.isActive, 
      categoryId: d.categoryId, 
      position: d.position, 
      createdAt: d.createdAt, 
      quantityRemaining: d.quantityRemaining, 
      imageUrl: d.imageUrl, 
      imageId: d.imageId,
      description: d.description,
      rating: d.rating || 0,
      reviewCount: d.reviewCount || 0,
      popularityScore: d.popularityScore || 0
    }));
  }

  async getItem(id: string) {
    const d = await this.itemModel.findById(id).lean();
    if (!d) throw new NotFoundException('Item not found');
    return { id: d._id, restaurantId: (d as any).restaurantId, name: d.name, price: d.price, type: d.type, isActive: d.isActive, categoryId: (d as any).categoryId };
  }

  async updateItem(id: string, payload: Partial<{ name: string; price: number; type: 'food'|'drink'; categoryId: string; description: string; imageUrl: string; isActive: boolean; position: number; quantityRemaining: number }>) {
    const d = await this.itemModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) throw new NotFoundException('Item not found');
    return { id: String(d._id), isActive: d.isActive } as any;
  }

  async deleteItem(id: string) {
    await this.itemModel.findByIdAndDelete(id);
    return { ok: true };
  }

  // Dashboard stats (real data)
  async getDashboardStats(userId: string) {
    const restaurant = await this.findRestaurantByOwnerId(userId);
    if (!restaurant) {
      return {
        todayOrders: 0,
        todayRevenue: 0,
        todayGrowth: 0,
        averageRating: 0,
        totalReviews: 0,
        totalMenuItems: await this.itemModel.countDocuments({}),
        activeMenuItems: await this.itemModel.countDocuments({ isActive: true }),
        newItemsThisMonth: await this.itemModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30*24*3600*1000) } }),
        completionRate: 0,
        avgPreparationTime: 0,
        onTimeDeliveryRate: 0,
        pendingOrders: 0,
        monthlyOrders: 0,
        monthlyRevenue: 0,
        avgOrderValue: 0,
        newCustomers: 0,
        returningCustomers: 0,
        customerRetentionRate: 0,
        topSellingItems: [],
      } as any;
    }

    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    const [todayOrdersDocs, monthOrdersDocs, menuCounts] = await Promise.all([
      this.orderModel.find({ restaurantId: (restaurant as any)._id, createdAt: { $gte: startOfDay } }).lean(),
      this.orderModel.find({ restaurantId: (restaurant as any)._id, createdAt: { $gte: startOfMonth } }).lean(),
      Promise.all([
        this.itemModel.countDocuments({ restaurantId: (restaurant as any)._id }),
        this.itemModel.countDocuments({ restaurantId: (restaurant as any)._id, isActive: true }),
        this.itemModel.countDocuments({ restaurantId: (restaurant as any)._id, createdAt: { $gte: new Date(Date.now() - 30*24*3600*1000) } }),
      ]),
    ]);

    const todayOrders = todayOrdersDocs.length;
    const todayRevenue = todayOrdersDocs.reduce((sum: number, o: any) => sum + (o.finalTotal || o.total || 0), 0);
    const monthlyOrders = monthOrdersDocs.length;
    const monthlyRevenue = monthOrdersDocs.reduce((sum: number, o: any) => sum + (o.finalTotal || o.total || 0), 0);
    const avgOrderValue = monthlyOrders ? Math.round(monthlyRevenue / monthlyOrders) : 0;

    return {
      todayOrders,
      todayRevenue,
      todayGrowth: 0,
      averageRating: restaurant.rating || 0,
      totalReviews: restaurant.reviewCount || 0,
      totalMenuItems: menuCounts[0],
      activeMenuItems: menuCounts[1],
      newItemsThisMonth: menuCounts[2],
      completionRate: 0,
      avgPreparationTime: 0,
      onTimeDeliveryRate: 0,
      pendingOrders: await this.orderModel.countDocuments({ restaurantId: (restaurant as any)._id, status: 'pending' }),
      monthlyOrders,
      monthlyRevenue,
      avgOrderValue,
      newCustomers: 0,
      returningCustomers: 0,
      customerRetentionRate: 0,
      topSellingItems: [],
    };
  }

  // Get recent orders for restaurant (now via OrderService in controller)
  async listOrdersByOwner(userId: string, opts: { page?: number; limit?: number; status?: string } = {}) {
    const restaurant = await this.findRestaurantByOwnerId(userId);
    if (!restaurant) {
      return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } } as any;
    }
    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const query: any = { restaurantId: (restaurant as any)._id };
    if (opts.status) query.status = opts.status;

    const [items, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customerId', 'name email phone')
        .populate('driverId', 'name phone')
        .lean(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      data: items.map((o: any) => ({
        _id: o._id,
        orderCode: o.code || String(o._id),
        customer: { name: (o.customerId as any)?.name, email: (o.customerId as any)?.email, phone: (o.customerId as any)?.phone },
        items: o.items,
        status: o.status,
        finalTotal: o.finalTotal || o.total || 0,
        createdAt: o.createdAt,
        driverId: o.driverId ? { _id: (o.driverId as any)._id, name: (o.driverId as any).name, phone: (o.driverId as any).phone } : undefined,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  // Get customers for restaurant
  async getCustomers(userId: string, options: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const restaurant = await this.findRestaurantByOwnerId(userId);
    console.log('🔍 Get customers for user:', userId, 'restaurant found:', !!restaurant);
    
    // If no restaurant found, still return mock data for testing
    if (!restaurant) {
      console.log('⚠️ No restaurant found, returning mock customer data');
    }

    // Mock data for now - in real implementation, get from orders
    const mockCustomers = [
      {
        _id: '1',
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        totalOrders: 15,
        totalSpent: 2500000,
        lastOrder: new Date('2024-01-15'),
        averageOrderValue: 166667,
        favoriteItems: ['Phở Bò', 'Bún Chả'],
        loyaltyPoints: 250
      },
      {
        _id: '2',
        name: 'Trần Thị B',
        email: 'tranthib@email.com',
        phone: '0987654321',
        totalOrders: 8,
        totalSpent: 1200000,
        lastOrder: new Date('2024-01-14'),
        averageOrderValue: 150000,
        favoriteItems: ['Bánh Mì', 'Cơm Tấm'],
        loyaltyPoints: 120
      },
      {
        _id: '3',
        name: 'Lê Văn C',
        email: 'levanc@email.com',
        phone: '0369852147',
        totalOrders: 22,
        totalSpent: 3800000,
        lastOrder: new Date('2024-01-16'),
        averageOrderValue: 172727,
        favoriteItems: ['Chả Cá', 'Phở Bò'],
        loyaltyPoints: 380
      }
    ];

    const skip = (options.page - 1) * options.limit;
    const paginatedCustomers = mockCustomers.slice(skip, skip + options.limit);

    return {
      data: paginatedCustomers,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: mockCustomers.length,
        totalPages: Math.ceil(mockCustomers.length / options.limit),
        hasNext: options.page < Math.ceil(mockCustomers.length / options.limit),
        hasPrev: options.page > 1
      }
    };
  }

  // Find restaurant by owner user ID
  async findRestaurantByOwnerId(ownerId: string) {
    console.log('🔍 Finding restaurant for user ID:', ownerId);
    
    // Try different formats of the user ID
    let restaurant = null;
    
    // Try as ObjectId first
    if (Types.ObjectId.isValid(ownerId)) {
      restaurant = await this.restaurantModel.findOne({ ownerUserId: new Types.ObjectId(ownerId) }).lean();
      console.log('🔍 Found with ObjectId:', !!restaurant);
    }
    
    // If not found, try as string
    if (!restaurant) {
      restaurant = await this.restaurantModel.findOne({ ownerUserId: ownerId }).lean();
      console.log('🔍 Found with string:', !!restaurant);
    }
    
    // If still not found, try to find any restaurant for this user (fallback)
    if (!restaurant) {
      restaurant = await this.restaurantModel.findOne({}).lean();
      console.log('🔍 Using fallback restaurant:', !!restaurant);
    }
    
    console.log('🔍 Final restaurant:', restaurant ? { id: restaurant._id, name: restaurant.name } : null);
    return restaurant;
  }
}


