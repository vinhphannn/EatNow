import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../restaurant/schemas/category.schema';
import { SubCategory, SubCategoryDocument } from '../common/schemas/subcategory.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(SubCategory.name) private readonly subCategoryModel: Model<SubCategoryDocument>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find({ isActive: true }).sort({ position: 1 }).exec();
  }

  async findAllWithSubCategories(): Promise<any[]> {
    console.log('Loading categories with subcategories...');
    const categories = await this.categoryModel
      .find({ isActive: true })
      .sort({ position: 1 })
      .exec();

    console.log('Found categories:', categories.length);

    const categoriesWithSubCategories = await Promise.all(
      categories.map(async (category) => {
        console.log(`Loading subcategories for category: ${category.name} (${category._id})`);
        
        // Debug: Check all subcategories first
        const allSubCategories = await this.subCategoryModel.find({}).exec();
        console.log('All subcategories in DB:', allSubCategories.map(sc => ({
          id: sc._id,
          name: sc.name,
          categoryId: sc.categoryId,
          isActive: sc.isActive
        })));
        
        // Debug: Check subcategories with this categoryId (try both string and ObjectId)
        const categoryIdString = String(category._id);
        const subCategoriesWithCategoryId = await this.subCategoryModel
          .find({ categoryId: categoryIdString })
          .exec();
        console.log(`Subcategories with categoryId string ${categoryIdString}:`, subCategoriesWithCategoryId.map(sc => ({
          id: sc._id,
          name: sc.name,
          isActive: sc.isActive
        })));
        
        const subCategories = await this.subCategoryModel
          .find({ 
            categoryId: categoryIdString,
            isActive: true 
          })
          .sort({ position: 1 })
          .exec();

        console.log(`Found ${subCategories.length} active subcategories for ${category.name}:`, subCategories.map(sc => sc.name));

        return {
          ...category.toObject(),
          subCategories
        };
      })
    );

    console.log('Final result:', categoriesWithSubCategories.map(cat => ({
      name: cat.name,
      subCategoriesCount: cat.subCategories.length
    })));

    return categoriesWithSubCategories;
  }

  async debugSubCategories(): Promise<any> {
    const categories = await this.categoryModel.find({}).exec();
    const subCategories = await this.subCategoryModel.find({}).exec();
    
    return {
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        idType: typeof cat._id
      })),
      subCategories: subCategories.map(sc => ({
        id: sc._id,
        name: sc.name,
        categoryId: sc.categoryId,
        categoryIdType: typeof sc.categoryId,
        isActive: sc.isActive
      }))
    };
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
    console.log('Creating category with data:', createCategoryDto);
    
    // Check if slug is unique
    const existingCategory = await this.categoryModel.findOne({ 
      slug: createCategoryDto.slug 
    });
    if (existingCategory) {
      console.log('Category with slug already exists:', createCategoryDto.slug);
      throw new ConflictException('Category with this slug already exists');
    }

    // Prepare category data
    const categoryData: any = {
      name: createCategoryDto.name,
      slug: createCategoryDto.slug,
      description: createCategoryDto.description || '',
      icon: createCategoryDto.icon || '🍽️',
      color: createCategoryDto.color || 'from-gray-400 to-gray-500',
      position: createCategoryDto.position || 0,
      isActive: createCategoryDto.isActive !== false,
      imageUrl: createCategoryDto.imageUrl || '',
    };

    // Add restaurantId if provided
    if (createCategoryDto.restaurantId) {
      categoryData.restaurantId = new Types.ObjectId(createCategoryDto.restaurantId);
      console.log('Added restaurantId:', categoryData.restaurantId);
    }

    console.log('Final category data:', categoryData);

    const category = new this.categoryModel(categoryData);
    const savedCategory = await category.save();
    console.log('Category saved successfully:', savedCategory._id);
    
    return savedCategory;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    // Check if slug is unique (if slug is being updated)
    if (updateCategoryDto.slug) {
      const existingCategory = await this.categoryModel.findOne({ 
        slug: updateCategoryDto.slug,
        _id: { $ne: id }
      });
      if (existingCategory) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    // Prepare update data
    const updateData: any = { ...updateCategoryDto };
    
    // Handle restaurantId if provided
    if (updateCategoryDto.restaurantId) {
      updateData.restaurantId = new Types.ObjectId(updateCategoryDto.restaurantId);
    }

    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      updateData,
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
        slug: 'mon-viet',
        description: 'Món ăn truyền thống Việt Nam',
        icon: '🍜',
        color: 'from-orange-400 to-red-500',
        position: 1,
        isActive: true
      },
      {
        name: 'Fast Food',
        slug: 'fast-food',
        description: 'Đồ ăn nhanh',
        icon: '🍔',
        color: 'from-yellow-400 to-orange-500',
        position: 2,
        isActive: true
      },
      {
        name: 'Đồ uống',
        slug: 'do-uong',
        description: 'Nước uống và thức uống',
        icon: '🥤',
        color: 'from-blue-400 to-cyan-500',
        position: 3,
        isActive: true
      },
      {
        name: 'Tráng miệng',
        slug: 'trang-mieng',
        description: 'Bánh ngọt và kem',
        icon: '🍰',
        color: 'from-pink-400 to-purple-500',
        position: 4,
        isActive: true
      },
      {
        name: 'Món chay',
        slug: 'mon-chay',
        description: 'Thức ăn chay',
        icon: '🥗',
        color: 'from-green-400 to-emerald-500',
        position: 5,
        isActive: true
      },
      {
        name: 'Món Nhật',
        slug: 'mon-nhat',
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
