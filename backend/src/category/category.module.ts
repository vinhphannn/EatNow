import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { SubCategoryController } from './subcategory.controller';
import { SubCategoryService } from './subcategory.service';
import { Category, CategorySchema } from '../restaurant/schemas/category.schema';
import { SubCategory, SubCategorySchema } from '../common/schemas/subcategory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema }
    ])
  ],
  controllers: [CategoryController, SubCategoryController],
  providers: [CategoryService, SubCategoryService],
  exports: [CategoryService, SubCategoryService]
})
export class CategoryModule {}
