import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ItemOptionSeparate, ItemOptionSeparateDocument } from './schemas/item-option-separate.schema';
import { CreateItemOptionSeparateDto, UpdateItemOptionSeparateDto } from './dto/item-option-separate.dto';

@Injectable()
export class ItemOptionSeparateService {
  constructor(
    @InjectModel(ItemOptionSeparate.name) 
    private readonly itemOptionModel: Model<ItemOptionSeparateDocument>,
  ) {}

  async create(createDto: CreateItemOptionSeparateDto): Promise<ItemOptionSeparate> {
    const option = new this.itemOptionModel({
      ...createDto,
      itemId: new Types.ObjectId(createDto.itemId),
    });
    return option.save();
  }

  async findAllByItemId(itemId: string): Promise<ItemOptionSeparate[]> {
    return this.itemOptionModel
      .find({ 
        itemId: new Types.ObjectId(itemId), 
        isActive: true 
      })
      .sort({ position: 1 })
      .exec();
  }

  async findById(id: string): Promise<ItemOptionSeparate> {
    const option = await this.itemOptionModel.findById(id).exec();
    if (!option) {
      throw new NotFoundException('Item option not found');
    }
    return option;
  }

  async update(id: string, updateDto: UpdateItemOptionSeparateDto): Promise<ItemOptionSeparate> {
    const option = await this.itemOptionModel.findByIdAndUpdate(
      id,
      updateDto,
      { new: true }
    ).exec();

    if (!option) {
      throw new NotFoundException('Item option not found');
    }

    return option;
  }

  async delete(id: string): Promise<void> {
    const result = await this.itemOptionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Item option not found');
    }
  }

  async deleteByItemId(itemId: string): Promise<void> {
    await this.itemOptionModel.deleteMany({ 
      itemId: new Types.ObjectId(itemId) 
    }).exec();
  }
}

