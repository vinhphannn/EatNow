import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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

  async findAllPublicRestaurants(options?: { limit?: number; skip?: number; category?: string }) {
    const limit = options?.limit || 20;
    const skip = options?.skip || 0;
    
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
    
    // Nếu không có dữ liệu, trả về dữ liệu mẫu
    if (docs.length === 0) {
      return [
        {
          id: "demo-1",
          name: "Pizza Hut",
          description: "Nhà hàng pizza nổi tiếng thế giới với hương vị đặc trưng",
          address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
          imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
          rating: 4.5,
          deliveryTime: "25-35 phút",
          category: "Pizza",
          isOpen: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "demo-2",
          name: "KFC",
          description: "Gà rán KFC với công thức độc quyền, giòn tan bên ngoài",
          address: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
          imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
          rating: 4.3,
          deliveryTime: "20-30 phút",
          category: "Đồ ăn nhanh",
          isOpen: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "demo-3",
          name: "McDonald's",
          description: "Burger và đồ ăn nhanh với chất lượng quốc tế",
          address: "789 Đường Đồng Khởi, Quận 1, TP.HCM",
          imageUrl: "https://images.unsplash.com/photo-1626205074719-f067063d5541?w=400",
          rating: 4.1,
          deliveryTime: "18-28 phút",
          category: "Đồ ăn nhanh",
          isOpen: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "demo-4",
          name: "Phở 24",
          description: "Phở bò truyền thống với nước dùng đậm đà",
          address: "321 Đường Pasteur, Quận 3, TP.HCM",
          imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
          rating: 4.7,
          deliveryTime: "15-25 phút",
          category: "Món Việt",
          isOpen: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
    
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

  async updateRestaurant(id: string, payload: { name?: string; status?: string; description?: string; address?: string; openingHours?: string; openTime?: string; closeTime?: string; openDays?: number[]; latitude?: number; longitude?: number }) {
    const d = await this.restaurantModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) throw new NotFoundException('Restaurant not found');
    return { id: String(d._id), name: d.name, status: d.status, ownerUserId: (d as any).ownerUserId, description: (d as any).description, address: (d as any).address, openingHours: (d as any).openingHours, openTime: (d as any).openTime, closeTime: (d as any).closeTime, openDays: (d as any).openDays, latitude: (d as any).latitude, longitude: (d as any).longitude };
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

  async listItems(restaurantId: string, filter?: { type?: 'food'|'drink'; categoryId?: string; isActive?: string; sortBy?: 'position'|'createdAt'|'price'; order?: 'asc'|'desc' }) {
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
    const docs = await this.itemModel
      .find(q, { name: 1, price: 1, type: 1, isActive: 1, categoryId: 1, position: 1, createdAt: 1, quantityRemaining: 1, imageUrl: 1, imageId: 1, description: 1, rating: 1, reviewCount: 1, popularityScore: 1 })
      .sort(sort)
      .lean();
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
    return { id: d._id };
  }

  async deleteItem(id: string) {
    await this.itemModel.findByIdAndDelete(id);
    return { ok: true };
  }

  // Dashboard stats
  async getDashboardStats(userId: string) {
    const restaurant = await this.findRestaurantByOwnerId(userId);
    console.log('🔍 Dashboard stats for user:', userId, 'restaurant found:', !!restaurant);
    
    // If no restaurant found, still return mock data for testing
    if (!restaurant) {
      console.log('⚠️ No restaurant found, returning mock data');
    }

    // Mock data for now - in real implementation, calculate from orders
    return {
      todayOrders: 15,
      todayRevenue: 2500000,
      todayGrowth: 12.5,
      averageRating: 4.3,
      totalReviews: 128,
      totalMenuItems: 25,
      activeMenuItems: 22,
      newItemsThisMonth: 3,
      completionRate: 96.8,
      avgPreparationTime: 18,
      onTimeDeliveryRate: 94.2,
      pendingOrders: 3,
      monthlyOrders: 450,
      monthlyRevenue: 75000000,
      avgOrderValue: 166667,
      newCustomers: 23,
      returningCustomers: 127,
      customerRetentionRate: 84.7,
      topSellingItems: [
        { itemId: '1', name: 'Phở Bò', orders: 45, revenue: 2700000 },
        { itemId: '2', name: 'Bún Chả', orders: 38, revenue: 2280000 },
        { itemId: '3', name: 'Bánh Mì', orders: 32, revenue: 1280000 },
        { itemId: '4', name: 'Cơm Tấm', orders: 28, revenue: 1960000 },
        { itemId: '5', name: 'Chả Cá', orders: 25, revenue: 2000000 }
      ]
    };
  }

  // Get recent orders for restaurant
  async getRecentOrders(userId: string, limit: number = 5) {
    const restaurant = await this.findRestaurantByOwnerId(userId);
    console.log('🔍 Get recent orders for user:', userId, 'restaurant found:', !!restaurant);
    
    // If no restaurant found, still return mock data for testing
    if (!restaurant) {
      console.log('⚠️ No restaurant found, returning mock recent orders data');
    }

    // Mock data for now - in real implementation, get from orders collection
    const mockOrders = [
      {
        _id: '1',
        code: 'ORD001',
        customer: { name: 'Nguyễn Văn A', phone: '0123456789' },
        items: [
          { name: 'Phở Bò', quantity: 1, price: 50000 },
          { name: 'Nước Cam', quantity: 1, price: 15000 }
        ],
        status: 'pending',
        finalTotal: 65000,
        createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        _id: '2',
        code: 'ORD002',
        customer: { name: 'Trần Thị B', phone: '0987654321' },
        items: [
          { name: 'Bún Chả', quantity: 2, price: 45000 },
          { name: 'Coca Cola', quantity: 2, price: 20000 }
        ],
        status: 'preparing',
        finalTotal: 130000,
        createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        _id: '3',
        code: 'ORD003',
        customer: { name: 'Lê Văn C', phone: '0369258147' },
        items: [
          { name: 'Cơm Tấm', quantity: 1, price: 35000 }
        ],
        status: 'ready',
        finalTotal: 35000,
        createdAt: new Date(Date.now() - 1000 * 60 * 90) // 1.5 hours ago
      }
    ];

    return mockOrders.slice(0, limit);
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


