import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RestaurantCategory, RestaurantCategoryDocument } from './schemas/restaurant-category.schema';

@Injectable()
export class RestaurantCategoryService {
  constructor(
    @InjectModel(RestaurantCategory.name) 
    private readonly restaurantCategoryModel: Model<RestaurantCategoryDocument>,
  ) {}

  async findAll(restaurantId: string): Promise<RestaurantCategory[]> {
    return this.restaurantCategoryModel
      .find({ 
        restaurantId: new Types.ObjectId(restaurantId),
        isActive: true 
      })
      .sort({ position: 1 })
      .exec();
  }

  async findById(id: string): Promise<RestaurantCategory> {
    const category = await this.restaurantCategoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Restaurant category not found');
    }
    return category;
  }

  async create(restaurantId: string, createData: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    position?: number;
    isActive?: boolean;
    imageUrl?: string;
  }): Promise<RestaurantCategory> {
    console.log('Creating restaurant category with data:', createData);
    
    // Check if slug is unique within this restaurant
    const existingCategory = await this.restaurantCategoryModel.findOne({ 
      restaurantId: new Types.ObjectId(restaurantId),
      slug: createData.slug 
    });
    if (existingCategory) {
      console.log('Restaurant category with slug already exists:', createData.slug);
      throw new ConflictException('Restaurant category with this slug already exists');
    }

    const categoryData = {
      restaurantId: new Types.ObjectId(restaurantId),
      name: createData.name,
      slug: createData.slug,
      description: createData.description || '',
      icon: createData.icon || '🍽️',
      color: createData.color || 'from-gray-400 to-gray-500',
      position: createData.position || 0,
      isActive: createData.isActive !== false,
      imageUrl: createData.imageUrl || '',
    };

    console.log('Final restaurant category data:', categoryData);

    const category = new this.restaurantCategoryModel(categoryData);
    const savedCategory = await category.save();
    console.log('Restaurant category saved successfully:', savedCategory._id);
    
    return savedCategory;
  }

  async update(id: string, updateData: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    color?: string;
    position?: number;
    isActive?: boolean;
    imageUrl?: string;
  }): Promise<RestaurantCategory> {
    // Check if slug is unique within the same restaurant (if slug is being updated)
    if (updateData.slug) {
      const category = await this.restaurantCategoryModel.findById(id);
      if (category) {
        const existingCategory = await this.restaurantCategoryModel.findOne({
          restaurantId: category.restaurantId,
          slug: updateData.slug,
          _id: { $ne: id }
        });
        if (existingCategory) {
          throw new ConflictException('Restaurant category with this slug already exists');
        }
      }
    }

    const updatedCategory = await this.restaurantCategoryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).exec();

    if (!updatedCategory) {
      throw new NotFoundException('Restaurant category not found');
    }

    return updatedCategory;
  }

  async delete(id: string): Promise<void> {
    const result = await this.restaurantCategoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Restaurant category not found');
    }
  }

  async updatePosition(id: string, position: number): Promise<RestaurantCategory> {
    const category = await this.restaurantCategoryModel.findByIdAndUpdate(
      id,
      { position },
      { new: true }
    ).exec();

    if (!category) {
      throw new NotFoundException('Restaurant category not found');
    }

    return category;
  }

  async seedDefaultRestaurantCategories(restaurantId: string): Promise<RestaurantCategory[]> {
    const defaultCategories = [
      {
        name: 'Món chính',
        slug: 'mon-chinh',
        description: 'Các món ăn chính',
        icon: '🍽️',
        color: 'from-orange-400 to-red-500',
        position: 1,
        isActive: true
      },
      {
        name: 'Món thêm',
        slug: 'mon-them',
        description: 'Các món ăn phụ',
        icon: '🥗',
        color: 'from-green-400 to-emerald-500',
        position: 2,
        isActive: true
      },
      {
        name: 'Giải khát',
        slug: 'giai-khat',
        description: 'Nước uống và thức uống',
        icon: '🥤',
        color: 'from-blue-400 to-cyan-500',
        position: 3,
        isActive: true
      },
      {
        name: 'Đồ ăn vặt',
        slug: 'do-an-vat',
        description: 'Snacks và đồ ăn nhẹ',
        icon: '🍿',
        color: 'from-yellow-400 to-orange-500',
        position: 4,
        isActive: true
      },
      {
        name: 'Tráng miệng',
        slug: 'trang-mieng',
        description: 'Bánh ngọt và kem',
        icon: '🍰',
        color: 'from-pink-400 to-purple-500',
        position: 5,
        isActive: true
      }
    ];

    // Check if restaurant already has categories
    const existingCount = await this.restaurantCategoryModel.countDocuments({ 
      restaurantId: new Types.ObjectId(restaurantId) 
    });
    if (existingCount > 0) {
      return this.restaurantCategoryModel.find({ 
        restaurantId: new Types.ObjectId(restaurantId) 
      }).exec();
    }

    // Create default categories for this restaurant
    const categoriesToInsert = defaultCategories.map(cat => ({
      ...cat,
      restaurantId: new Types.ObjectId(restaurantId)
    }));

    const categories = await this.restaurantCategoryModel.insertMany(categoriesToInsert);
    return categories;
  }
}
