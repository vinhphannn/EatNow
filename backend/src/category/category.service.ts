import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../restaurant/schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find({ isActive: true }).sort({ position: 1 }).exec();
  }

  async findPublicCategories(): Promise<Category[]> {
    // Lấy categories công khai (không thuộc restaurant cụ thể)
    return this.categoryModel.find({ 
      isActive: true,
      $or: [
        { restaurantId: { $exists: false } },
        { restaurantId: null }
      ]
    }).sort({ position: 1 }).exec();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = new this.categoryModel(createCategoryDto);
    return category.save();
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      { new: true }
    ).exec();
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    
    return category;
  }

  async delete(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Category not found');
    }
  }

  async seedDefaultCategories(): Promise<Category[]> {
    const defaultCategories = [
      {
        name: 'Món Việt',
        description: 'Món ăn truyền thống Việt Nam',
        icon: '🍜',
        color: 'from-orange-400 to-red-500',
        position: 1,
        isActive: true
      },
      {
        name: 'Fast Food',
        description: 'Đồ ăn nhanh',
        icon: '🍔',
        color: 'from-yellow-400 to-orange-500',
        position: 2,
        isActive: true
      },
      {
        name: 'Đồ uống',
        description: 'Nước uống và thức uống',
        icon: '🥤',
        color: 'from-blue-400 to-cyan-500',
        position: 3,
        isActive: true
      },
      {
        name: 'Tráng miệng',
        description: 'Bánh ngọt và kem',
        icon: '🍰',
        color: 'from-pink-400 to-purple-500',
        position: 4,
        isActive: true
      },
      {
        name: 'Món chay',
        description: 'Thức ăn chay',
        icon: '🥗',
        color: 'from-green-400 to-emerald-500',
        position: 5,
        isActive: true
      },
      {
        name: 'Món Nhật',
        description: 'Ẩm thực Nhật Bản',
        icon: '🍣',
        color: 'from-red-400 to-pink-500',
        position: 6,
        isActive: true
      }
    ];

    // Kiểm tra xem đã có categories chưa
    const existingCount = await this.categoryModel.countDocuments();
    if (existingCount > 0) {
      return this.categoryModel.find().exec();
    }

    // Tạo default categories
    const categories = await this.categoryModel.insertMany(defaultCategories);
    return categories;
  }
}
