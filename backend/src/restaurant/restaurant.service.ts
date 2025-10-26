import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model as MModel } from 'mongoose';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { FilterQuery, Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { RestaurantCategory, RestaurantCategoryDocument } from './schemas/restaurant-category.schema';
import { Item, ItemDocument } from './schemas/item.schema';
import { ItemOptionSeparate, ItemOptionSeparateDocument } from './schemas/item-option-separate.schema';
import { OptionChoiceSeparate, OptionChoiceSeparateDocument } from './schemas/option-choice-separate.schema';
import { ItemOptionSeparateService } from './item-option-separate.service';
import { OptionChoiceSeparateService } from './option-choice-separate.service';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(RestaurantCategory.name) private readonly restaurantCategoryModel: Model<RestaurantCategoryDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(ItemOptionSeparate.name) private readonly itemOptionModel: Model<ItemOptionSeparateDocument>,
    @InjectModel(OptionChoiceSeparate.name) private readonly optionChoiceModel: Model<OptionChoiceSeparateDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly itemOptionService: ItemOptionSeparateService,
    private readonly optionChoiceService: OptionChoiceSeparateService,
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

    // Create default categories for the new restaurant
    await this.createDefaultCategoriesForRestaurant(doc._id);

    return { id: String(doc._id), name: doc.name, status: doc.status, ownerUserId: doc.ownerUserId };
  }

  // Create default categories for a new restaurant
  private async createDefaultCategoriesForRestaurant(restaurantId: Types.ObjectId) {
    const defaultCategories = [
      {
        restaurantId: restaurantId,
        name: 'Món chính',
        slug: `mon-chinh-${restaurantId}`,
        description: 'Các món ăn chính của nhà hàng',
        icon: '🍽️',
        color: 'from-orange-400 to-red-500',
        position: 1,
        isActive: true
      },
      {
        restaurantId: restaurantId,
        name: 'Món thêm',
        slug: `mon-them-${restaurantId}`,
        description: 'Các món ăn kèm, món phụ',
        icon: '🥗',
        color: 'from-green-400 to-emerald-500',
        position: 2,
        isActive: true
      },
      {
        restaurantId: restaurantId,
        name: 'Giải khát',
        slug: `giai-khat-${restaurantId}`,
        description: 'Nước uống, đồ giải khát',
        icon: '🥤',
        color: 'from-blue-400 to-cyan-500',
        position: 3,
        isActive: true
      },
      {
        restaurantId: restaurantId,
        name: 'Đồ ăn vặt',
        slug: `do-an-vat-${restaurantId}`,
        description: 'Snack, đồ ăn vặt',
        icon: '🍿',
        color: 'from-yellow-400 to-orange-500',
        position: 4,
        isActive: true
      },
      {
        restaurantId: restaurantId,
        name: 'Tráng miệng',
        slug: `trang-mieng-${restaurantId}`,
        description: 'Bánh ngọt, kem, chè',
        icon: '🍰',
        color: 'from-pink-400 to-purple-500',
        position: 5,
        isActive: true
      }
    ];

    try {
      await this.categoryModel.insertMany(defaultCategories);
      console.log(`✅ Created default categories for restaurant ${restaurantId}`);
    } catch (error) {
      console.error(`❌ Error creating default categories for restaurant ${restaurantId}:`, error.message);
      // Don't throw error to avoid breaking restaurant creation
    }
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

  async getFeaturedCollections() {
    // Import FeaturedCollection model dynamically
    const featuredCollectionModel = this.restaurantModel.db.model('FeaturedCollection');
    
    const collections = await featuredCollectionModel
      .find({
        isActive: true,
        $and: [
          {
            $or: [
              { validFrom: { $exists: false } },
              { validFrom: { $lte: new Date() } }
            ]
          },
          {
            $or: [
              { validUntil: { $exists: false } },
              { validUntil: { $gte: new Date() } }
            ]
          }
        ]
      })
      .sort({ position: 1, createdAt: -1 })
      .lean();

    const result: any[] = [];
    for (const c of collections) {
      const limit = 6; // default display size
      const main = (c as any).mainCriteria || 'highRated';
      let query = this.restaurantModel.find({ status: 'active' }, {
        name: 1,
        description: 1,
        imageUrl: 1,
        rating: 1,
        deliveryFee: 1,
        isOpen: 1,
      });
      if (main === 'highRated') {
        query = query.sort({ rating: -1, createdAt: -1 });
      } else if (main === 'bestSellers') {
        // Fallback: use reviewCount/popularity if available
        query = query.sort({ popularityScore: -1, reviewCount: -1, createdAt: -1 } as any);
      } else if (main === 'trending') {
        query = query.sort({ updatedAt: -1, createdAt: -1 });
      } else if (main === 'new') {
        query = query.sort({ createdAt: -1 });
      } else if (main === 'discount') {
        // Placeholder: no discount field; fallback to recent active
        query = query.sort({ createdAt: -1 });
      } else {
        query = query.sort({ createdAt: -1 });
      }
      const restaurants = await query.limit(limit).lean();
      result.push({
        _id: c._id,
        name: c.name,
        description: c.description,
        subtitle: c.subtitle,
        layout: c.layout,
        color: c.color,
        isFeatured: c.isFeatured,
        imageUrl: (c as any).imageUrl,
        mainCriteria: main,
        restaurants: restaurants.map((r: any) => ({
          _id: r._id,
          name: r.name,
          description: r.description,
          imageUrl: r.imageUrl,
          rating: r.rating,
          deliveryFee: r.deliveryFee,
          isOpen: r.isOpen,
        }))
      });
    }
    return result;
  }

  async findOneByOwnerUserId(ownerUserId: any) {
    const id = String(ownerUserId);
    const d = await this.restaurantModel.findOne({ ownerUserId: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id }).lean();
    if (!d) return null;
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
      isOpen: (d as any).isOpen,
      isAcceptingOrders: (d as any).isAcceptingOrders,
      isDeliveryAvailable: (d as any).isDeliveryAvailable,
      isPickupAvailable: (d as any).isPickupAvailable
    };
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

  async updateRestaurant(id: string, payload: { name?: string; status?: string; banReason?: string; description?: string; address?: string; openingHours?: string; openTime?: string; closeTime?: string; openDays?: number[]; latitude?: number; longitude?: number; isOpen?: boolean; isAcceptingOrders?: boolean; isDeliveryAvailable?: boolean; isPickupAvailable?: boolean }) {
    // Enforce: cannot set active without a valid address
    if (payload?.status === 'active') {
      const current = await this.restaurantModel.findById(id).lean();
      const address = (payload.address ?? (current as any)?.address) || '';
      if (!address || String(address).trim().length === 0) {
        const e: any = new Error('Không thể kích hoạt: nhà hàng thiếu địa chỉ');
        e.status = 400;
        throw e;
      }
    }
    const d = await this.restaurantModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) throw new NotFoundException('Restaurant not found');
    return { 
      id: String(d._id), 
      name: d.name, 
      status: d.status, 
      banReason: (d as any).banReason, 
      ownerUserId: (d as any).ownerUserId, 
      description: (d as any).description, 
      address: (d as any).address, 
      openingHours: (d as any).openingHours, 
      openTime: (d as any).openTime, 
      closeTime: (d as any).closeTime, 
      openDays: (d as any).openDays, 
      latitude: (d as any).latitude, 
      longitude: (d as any).longitude,
      isOpen: (d as any).isOpen,
      isAcceptingOrders: (d as any).isAcceptingOrders,
      isDeliveryAvailable: (d as any).isDeliveryAvailable,
      isPickupAvailable: (d as any).isPickupAvailable
    };
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
    const doc = await this.restaurantCategoryModel.create({ 
      restaurantId: new Types.ObjectId(restaurantId), 
      name: payload.name, 
      slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
      position: payload.position ?? 0 
    });
    return { id: doc._id, restaurantId: doc.restaurantId, name: doc.name, position: doc.position };
  }

  async listCategories(restaurantId: string) {
    console.log('Loading restaurant categories for restaurant:', restaurantId);
    console.log('RestaurantId type:', typeof restaurantId);
    
    // Convert string to ObjectId for query
    const restaurantObjectId = new Types.ObjectId(restaurantId);
    console.log('Restaurant ObjectId:', restaurantObjectId);
    
    const docs = await this.restaurantCategoryModel.find({ restaurantId: restaurantObjectId }, { name: 1, position: 1, createdAt: 1 }).sort({ position: 1, createdAt: 1 }).lean();
    console.log('Found restaurant categories:', docs.length);
    console.log('Raw docs:', docs);
    
    const result = docs.map((d: any) => ({ id: d._id, restaurantId: d.restaurantId, name: d.name, position: d.position, createdAt: d.createdAt }));
    console.log('Mapped restaurant categories:', result);
    return result;
  }

  async updateCategory(id: string, payload: { name?: string; position?: number }) {
    const d = await this.restaurantCategoryModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) throw new NotFoundException('Restaurant category not found');
    return { id: d._id, restaurantId: (d as any).restaurantId, name: d.name, position: d.position };
  }

  async deleteCategory(id: string) {
    await this.restaurantCategoryModel.findByIdAndDelete(id);
    await this.itemModel.updateMany({ categoryId: id }, { $unset: { categoryId: 1 } });
    return { ok: true };
  }

  // Items
  async createItem(restaurantId: string, payload: { 
    name: string; 
    basePrice: number;
    categoryId?: string; 
    subCategoryId?: string;
    description?: string; 
    imageUrl?: string; 
    isActive?: boolean; 
    position?: number; 
    preparationTime?: number;
    options?: any[];
  }) {
    const rest = await this.restaurantModel.exists({ _id: restaurantId });
    if (!rest) throw new NotFoundException('Restaurant not found');

    // Validate item name
    if (!payload.name || payload.name.trim() === '') {
      throw new Error('Item name cannot be empty');
    }

    // Validate base price
    if (!payload.basePrice || payload.basePrice <= 0) {
      throw new Error('Item base price must be greater than 0');
    }

    // Validate preparation time
    if (payload.preparationTime && (payload.preparationTime < 0 || payload.preparationTime > 300)) {
      throw new Error('Preparation time must be between 0 and 300 minutes');
    }
    
    // Calculate final price (basePrice + options default prices)
    let finalPrice = payload.basePrice;
    if (payload.options && payload.options.length > 0) {
      payload.options.forEach(option => {
        if (option.choices && option.choices.length > 0) {
          option.choices.forEach(choice => {
            if (choice.isDefault) {
              finalPrice += choice.price || 0;
            }
          });
        }
      });
    }
    
    console.log('🚀 Creating item with separate collections:', {
      restaurantId,
      basePrice: payload.basePrice,
      finalPrice,
      optionsCount: payload.options?.length || 0
    });

    // Create item first (without options)
    const itemData = { 
      restaurantId, 
      basePrice: payload.basePrice,
      price: finalPrice,
      name: payload.name,
      description: payload.description,
      imageUrl: payload.imageUrl,
      categoryId: payload.categoryId,
      subCategoryId: payload.subCategoryId,
      isActive: payload.isActive,
      position: payload.position,
      preparationTime: payload.preparationTime
    };

    try {
      console.log('📝 Creating item:', itemData);
      const item = await this.itemModel.create(itemData);
      console.log('✅ Item created, ID:', item._id);

      // Create options and choices in separate collections
      if (payload.options && payload.options.length > 0) {
        console.log('📝 Creating options and choices...');
        console.log('📝 Options payload:', JSON.stringify(payload.options, null, 2));
        console.log('📝 Item ID for options:', item._id.toString());
        
        for (const optionData of payload.options) {
          // Validate option
          if (!optionData.name || optionData.name.trim() === '') {
            throw new Error(`Option name cannot be empty`);
          }
          if (!optionData.type || !['single', 'multiple'].includes(optionData.type)) {
            throw new Error(`Option type must be 'single' or 'multiple'`);
          }
          if (!optionData.choices || optionData.choices.length === 0) {
            throw new Error(`Option "${optionData.name}" must have at least one choice`);
          }

          // Create option
          const optionCreateData = {
            itemId: item._id.toString(),
            name: optionData.name.trim(),
            type: optionData.type,
            required: Boolean(optionData.required),
            position: Number(optionData.position) || 0,
            isActive: Boolean(optionData.isActive !== false)
          };
          console.log('📝 Creating option with data:', optionCreateData);
          const option = await this.itemOptionService.create(optionCreateData);
          console.log('✅ Option created:', (option as any)._id);

          // Create choices
          for (const choiceData of optionData.choices) {
            // Validate choice
            if (!choiceData.name || choiceData.name.trim() === '') {
              throw new Error(`Choice name cannot be empty in option "${optionData.name}"`);
            }
            if (typeof choiceData.price !== 'number' || choiceData.price < 0) {
              throw new Error(`Choice "${choiceData.name}" price must be a non-negative number`);
            }

            const choiceCreateData = {
              optionId: (option as any)._id.toString(),
              name: choiceData.name.trim(),
              price: Number(choiceData.price) || 0,
              isDefault: Boolean(choiceData.isDefault),
              isActive: Boolean(choiceData.isActive !== false),
              position: Number(choiceData.position) || 0
            };
            console.log('📝 Creating choice with data:', choiceCreateData);
            const choice = await this.optionChoiceService.create(choiceCreateData);
            console.log('✅ Choice created:', (choice as any)._id);
          }
          console.log(`✅ Created ${optionData.choices.length} choices for option "${optionData.name}"`);
        }
      }

      console.log('🎉 Item with options created successfully!');
      return { id: item._id };
    } catch (error) {
      console.error('❌ Error creating item:', error);
      throw error;
    }
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
      .find(q, { name: 1, price: 1, basePrice: 1, type: 1, isActive: 1, categoryId: 1, subCategoryId: 1, position: 1, createdAt: 1, quantityRemaining: 1, imageUrl: 1, imageId: 1, description: 1, rating: 1, reviewCount: 1, popularityScore: 1, preparationTime: 1 })
      .sort(sort);
    // Apply limit only when provided and valid (>0). Do not force default 1.
    const parsedLimit = Number(filter?.limit);
    const hasValidLimit = Number.isFinite(parsedLimit) && parsedLimit > 0;
    if (hasValidLimit) {
      const n = Math.min(100, Math.floor(parsedLimit));
      qy = qy.limit(n);
    }
    const docs = await qy.lean();
    
    // Load options and choices for each item
    const itemsWithOptions = await Promise.all(
      docs.map(async (d: any) => {
        const options = await this.itemOptionService.findAllByItemId(d._id.toString());
        const optionsWithChoices = await Promise.all(
          options.map(async (option) => {
            const choices = await this.optionChoiceService.findAllByOptionId((option as any)._id.toString());
            return {
              id: (option as any)._id,
              name: option.name,
              type: option.type,
              required: option.required,
              position: option.position,
              isActive: option.isActive,
              choices: choices.map(choice => ({
                id: (choice as any)._id,
                name: choice.name,
                price: choice.price,
                isDefault: choice.isDefault,
                isActive: choice.isActive,
                position: choice.position
              }))
            };
          })
        );
        
        return { 
          id: d._id, 
          name: d.name, 
          price: d.price, 
          type: d.type, 
          isActive: d.isActive, 
          categoryId: d.categoryId, 
          subCategoryId: d.subCategoryId, 
          position: d.position, 
          createdAt: d.createdAt, 
          quantityRemaining: d.quantityRemaining, 
          imageUrl: d.imageUrl, 
          imageId: d.imageId, 
          description: d.description, 
          rating: d.rating || 0, 
          reviewCount: d.reviewCount || 0, 
          popularityScore: d.popularityScore || 0,
          preparationTime: d.preparationTime,
          basePrice: d.basePrice,
          options: optionsWithChoices
        };
      })
    );
    
    return itemsWithOptions;
  }

  async getItem(id: string) {
    const d = await this.itemModel.findById(id).lean();
    if (!d) throw new NotFoundException('Item not found');
    return { id: d._id, restaurantId: (d as any).restaurantId, name: d.name, price: d.price, type: d.type, isActive: d.isActive, categoryId: (d as any).categoryId };
  }

  async updateItem(id: string, payload: Partial<{ name: string; basePrice: number; type: 'food'|'drink'; categoryId: string; subCategoryId: string; description: string; imageUrl: string; isActive: boolean; position: number; preparationTime: number; options: any[] }>) {
    const updateData: any = { ...payload };

    // Remove options from updateData since we handle them separately
    delete updateData.options;

    // Calculate final price if basePrice or options are updated
    if (payload.basePrice !== undefined || payload.options !== undefined) {
      let finalPrice = payload.basePrice || 0;
      
      if (payload.options && payload.options.length > 0) {
        payload.options.forEach(option => {
          if (option.choices && option.choices.length > 0) {
            option.choices.forEach(choice => {
              if (choice.isDefault) {
                finalPrice += choice.price || 0;
              }
            });
          }
        });
      }
      
      updateData.price = finalPrice;
    }

    console.log('🔄 Updating item:', {
      id,
      updateData,
      optionsCount: payload.options?.length || 0
    });

    // Update item first
    const d = await this.itemModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    if (!d) throw new NotFoundException('Item not found');

    // Update options if provided
    if (payload.options !== undefined) {
      console.log('🔄 Updating options for item:', id);
      
      // Delete existing options and choices
      await this.itemOptionService.deleteByItemId(id);
      
      // Create new options and choices
      if (payload.options.length > 0) {
        for (const optionData of payload.options) {
          // Validate option
          if (!optionData.name || optionData.name.trim() === '') {
            throw new Error(`Option name cannot be empty`);
          }
          if (!optionData.type || !['single', 'multiple'].includes(optionData.type)) {
            throw new Error(`Option type must be 'single' or 'multiple'`);
          }
          if (!optionData.choices || optionData.choices.length === 0) {
            throw new Error(`Option "${optionData.name}" must have at least one choice`);
          }

          // Create option
          const option = await this.itemOptionService.create({
            itemId: id,
            name: optionData.name.trim(),
            type: optionData.type,
            required: Boolean(optionData.required),
            position: Number(optionData.position) || 0,
            isActive: Boolean(optionData.isActive !== false)
          });

          // Create choices
          for (const choiceData of optionData.choices) {
            // Validate choice
            if (!choiceData.name || choiceData.name.trim() === '') {
              throw new Error(`Choice name cannot be empty in option "${optionData.name}"`);
            }
            if (typeof choiceData.price !== 'number' || choiceData.price < 0) {
              throw new Error(`Choice "${choiceData.name}" price must be a non-negative number`);
            }

            await this.optionChoiceService.create({
              optionId: (option as any)._id.toString(),
              name: choiceData.name.trim(),
              price: Number(choiceData.price) || 0,
              isDefault: Boolean(choiceData.isDefault),
              isActive: Boolean(choiceData.isActive !== false),
              position: Number(choiceData.position) || 0
            });
          }
        }
      }
      
      console.log('✅ Options updated successfully');
    }

    return { id: String(d._id), isActive: d.isActive } as any;
  }

  async deleteItem(id: string) {
    // Delete options and choices first
    await this.itemOptionService.deleteByItemId(id);
    
    // Then delete the item
    await this.itemModel.findByIdAndDelete(id);
    return { ok: true };
  }

  // Lấy tất cả items từ tất cả restaurants (cho search)
  async findAllItems(options?: { limit?: number; skip?: number }) {
    const limit = Math.max(0, Number(options?.limit ?? 20));
    const skip = Math.max(0, Number(options?.skip ?? 0));
    
    const items = await this.itemModel
      .find({ isActive: true })
      .populate('restaurantId', 'name description imageUrl rating deliveryFee address')
      .select('name description price imageUrl rating reviewCount restaurantId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return items.map((item: any) => ({
      id: String(item._id),
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      rating: item.rating || 0,
      reviewCount: item.reviewCount || 0,
      restaurant: {
        _id: String(item.restaurantId._id),
        name: item.restaurantId.name,
        description: item.restaurantId.description,
        imageUrl: item.restaurantId.imageUrl,
        rating: item.restaurantId.rating,
        deliveryFee: item.restaurantId.deliveryFee,
        address: item.restaurantId.address
      }
    }));
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

  // Get today's stats for sidebar
  async getTodayStats(restaurantId: string, userId: string) {
    try {
      // Verify restaurant ownership
      const restaurant = await this.findRestaurantByOwnerId(userId);
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      // Verify the restaurantId matches the user's restaurant
      const userRestaurantId = (restaurant as any)._id?.toString();
      if (userRestaurantId !== restaurantId) {
        throw new NotFoundException('Restaurant not found');
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Get today's orders
      const todayOrders = await this.orderModel.find({
        restaurantId: new Types.ObjectId(restaurantId),
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).lean();

      // Calculate stats
      const todayOrdersCount = todayOrders.length;
      const todayRevenue = todayOrders.reduce((sum, order) => {
        return sum + (order.finalTotal || order.total || 0);
      }, 0);

      // Get pending orders count
      const pendingOrders = await this.orderModel.countDocuments({
        restaurantId: new Types.ObjectId(restaurantId),
        status: { $in: ['pending', 'confirmed', 'preparing'] }
      });

      return {
        todayOrders: todayOrdersCount,
        todayRevenue: todayRevenue,
        pendingOrders: pendingOrders
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return {
        todayOrders: 0,
        todayRevenue: 0,
        pendingOrders: 0
      };
    }
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
        .populate('driverId', 'name phone')
        .lean(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      data: items.map((o: any) => {
        // Debug log để kiểm tra deliveryAddress
        console.log('🔍 Order deliveryAddress:', {
          _id: o._id,
          deliveryAddress: o.deliveryAddress,
          recipientName: o.deliveryAddress?.recipientName,
          recipientPhone: o.deliveryAddress?.recipientPhone
        });
        
        return {
          _id: o._id,
          orderCode: o.code || String(o._id),
          // Thông tin người nhận từ deliveryAddress
          customerId: { 
            _id: o.customerId || '',
            name: o.deliveryAddress?.recipientName || 'Chưa cập nhật', 
            email: '', 
            phone: o.deliveryAddress?.recipientPhone || 'Chưa cập nhật'
          },
        customer: { 
          name: o.deliveryAddress?.recipientName || 'Chưa cập nhật', 
          email: '', 
          phone: o.deliveryAddress?.recipientPhone || 'Chưa cập nhật' 
        },
        items: o.items,
        status: o.status,
        total: o.total || 0,
        finalTotal: o.finalTotal || o.total || 0,
        deliveryFee: o.deliveryFee || 0,
        deliveryAddress: o.deliveryAddress,
        recipientName: o.deliveryAddress?.recipientName,
        recipientPhonePrimary: o.deliveryAddress?.recipientPhone,
        purchaserPhone: o.purchaserPhone,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        driverId: o.driverId ? { _id: (o.driverId as any)._id, name: (o.driverId as any).name, phone: (o.driverId as any).phone } : undefined,
        };
      }),
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
    
    if (!restaurant) {
      throw new Error('Restaurant not found for this user');
    }

    // Get real customer data from orders
    const customers = await this.getCustomersFromOrders(String(restaurant._id));

    const skip = (options.page - 1) * options.limit;
    const paginatedCustomers = customers.slice(skip, skip + options.limit);

    return {
      data: paginatedCustomers,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: customers.length,
        totalPages: Math.ceil(customers.length / options.limit),
        hasNext: options.page < Math.ceil(customers.length / options.limit),
        hasPrev: options.page > 1
      }
    };
  }

  // Get customers from orders for a restaurant
  async getCustomersFromOrders(restaurantId: string) {
    // This would typically aggregate from orders collection
    // For now, return empty array until we implement the real logic
    return [];
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


