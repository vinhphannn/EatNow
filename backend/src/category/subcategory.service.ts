import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubCategory, SubCategoryDocument } from '../common/schemas/subcategory.schema';
import { Category, CategoryDocument } from '../restaurant/schemas/category.schema';
import { CreateSubCategoryDto, UpdateSubCategoryDto } from './dto/subcategory.dto';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory.name) private readonly subCategoryModel: Model<SubCategoryDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(): Promise<SubCategory[]> {
    return this.subCategoryModel
      .find({ isActive: true })
      .populate('categoryId', 'name slug')
      .sort({ position: 1 })
      .exec();
  }

  async findByCategoryId(categoryId: string): Promise<SubCategory[]> {
    return this.subCategoryModel
      .find({ 
        categoryId: new Types.ObjectId(categoryId),
        isActive: true 
      })
      .sort({ position: 1 })
      .exec();
  }

  async findById(id: string): Promise<SubCategory> {
    const subCategory = await this.subCategoryModel
      .findById(id)
      .populate('categoryId', 'name slug')
      .exec();
    
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    
    return subCategory;
  }

  async findBySlug(slug: string): Promise<SubCategory> {
    const subCategory = await this.subCategoryModel
      .findOne({ slug, isActive: true })
      .populate('categoryId', 'name slug')
      .exec();
    
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    
    return subCategory;
  }

  async create(createSubCategoryDto: CreateSubCategoryDto): Promise<SubCategory> {
    console.log('Creating subcategory with data:', createSubCategoryDto);
    console.log('CategoryId type:', typeof createSubCategoryDto.categoryId);
    console.log('CategoryId value:', createSubCategoryDto.categoryId);
    
    // Check if category exists
    const category = await this.categoryModel.findById(createSubCategoryDto.categoryId);
    console.log('Found category:', category);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if slug is unique
    const existingSubCategory = await this.subCategoryModel.findOne({ 
      slug: createSubCategoryDto.slug 
    });
    if (existingSubCategory) {
      throw new ConflictException('SubCategory with this slug already exists');
    }

    const subCategory = new this.subCategoryModel(createSubCategoryDto);
    return subCategory.save();
  }

  async update(id: string, updateSubCategoryDto: UpdateSubCategoryDto): Promise<SubCategory> {
    // Check if category exists (if categoryId is being updated)
    if (updateSubCategoryDto.categoryId) {
      const category = await this.categoryModel.findById(updateSubCategoryDto.categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Check if slug is unique (if slug is being updated)
    if (updateSubCategoryDto.slug) {
      const existingSubCategory = await this.subCategoryModel.findOne({ 
        slug: updateSubCategoryDto.slug,
        _id: { $ne: id }
      });
      if (existingSubCategory) {
        throw new ConflictException('SubCategory with this slug already exists');
      }
    }

    const subCategory = await this.subCategoryModel
      .findByIdAndUpdate(id, updateSubCategoryDto, { new: true })
      .populate('categoryId', 'name slug')
      .exec();
    
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    
    return subCategory;
  }

  async delete(id: string): Promise<void> {
    const result = await this.subCategoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('SubCategory not found');
    }
  }

  async updatePosition(id: string, position: number): Promise<SubCategory> {
    const subCategory = await this.subCategoryModel
      .findByIdAndUpdate(id, { position }, { new: true })
      .populate('categoryId', 'name slug')
      .exec();
    
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    
    return subCategory;
  }

  async seedDefaultSubCategories(): Promise<SubCategory[]> {
    // Get existing categories
    const categories = await this.categoryModel.find({ isActive: true }).exec();
    if (categories.length === 0) {
      return [];
    }

    const defaultSubCategories = [
      // Món Việt
      {
        categoryId: categories.find(c => c.name === 'Món Việt')?._id,
        name: 'Phở',
        slug: 'pho',
        description: 'Phở bò, phở gà',
        position: 1,
        isActive: true
      },
      {
        categoryId: categories.find(c => c.name === 'Món Việt')?._id,
        name: 'Bún',
        slug: 'bun',
        description: 'Bún bò, bún chả, bún riêu',
        position: 2,
        isActive: true
      },
      {
        categoryId: categories.find(c => c.name === 'Món Việt')?._id,
        name: 'Cơm',
        slug: 'com',
        description: 'Cơm tấm, cơm gà, cơm sườn',
        position: 3,
        isActive: true
      },
      // Fast Food
      {
        categoryId: categories.find(c => c.name === 'Fast Food')?._id,
        name: 'Burger',
        slug: 'burger',
        description: 'Hamburger, cheeseburger',
        position: 1,
        isActive: true
      },
      {
        categoryId: categories.find(c => c.name === 'Fast Food')?._id,
        name: 'Pizza',
        slug: 'pizza',
        description: 'Pizza các loại',
        position: 2,
        isActive: true
      },
      {
        categoryId: categories.find(c => c.name === 'Fast Food')?._id,
        name: 'Gà rán',
        slug: 'ga-ran',
        description: 'Gà rán KFC, gà rán Hàn Quốc',
        position: 3,
        isActive: true
      },
      // Đồ uống
      {
        categoryId: categories.find(c => c.name === 'Đồ uống')?._id,
        name: 'Trà sữa',
        slug: 'tra-sua',
        description: 'Trà sữa các loại',
        position: 1,
        isActive: true
      },
      {
        categoryId: categories.find(c => c.name === 'Đồ uống')?._id,
        name: 'Cà phê',
        slug: 'ca-phe',
        description: 'Cà phê đen, cà phê sữa',
        position: 2,
        isActive: true
      },
      {
        categoryId: categories.find(c => c.name === 'Đồ uống')?._id,
        name: 'Nước ép',
        slug: 'nuoc-ep',
        description: 'Nước ép trái cây',
        position: 3,
        isActive: true
      }
    ].filter(sub => sub.categoryId); // Only include subcategories with valid categoryId

    // Check if subcategories already exist
    const existingCount = await this.subCategoryModel.countDocuments();
    if (existingCount > 0) {
      return this.subCategoryModel.find().populate('categoryId').exec();
    }

    // Create default subcategories
    const subCategories = await this.subCategoryModel.insertMany(defaultSubCategories);
    return this.subCategoryModel
      .find({ _id: { $in: subCategories.map(sc => sc._id) } })
      .populate('categoryId')
      .exec();
  }
}
