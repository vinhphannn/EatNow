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
    const doc = await this.restaurantModel.create({
      ownerUserId: payload.ownerUserId,
      name: payload.name,
      description: payload.description,
      address: payload.address,
      openingHours: payload.openingHours,
      openTime: payload.openTime,
      closeTime: payload.closeTime,
      openDays: payload.openDays,
      latitude: payload.latitude,
      longitude: payload.longitude,
      status: 'pending',
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
}


