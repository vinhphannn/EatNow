import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OptionChoiceSeparate, OptionChoiceSeparateDocument } from './schemas/option-choice-separate.schema';
import { CreateOptionChoiceSeparateDto, UpdateOptionChoiceSeparateDto } from './dto/option-choice-separate.dto';

@Injectable()
export class OptionChoiceSeparateService {
  constructor(
    @InjectModel(OptionChoiceSeparate.name) 
    private readonly optionChoiceModel: Model<OptionChoiceSeparateDocument>,
  ) {}

  async create(createDto: CreateOptionChoiceSeparateDto): Promise<OptionChoiceSeparate> {
    const choice = new this.optionChoiceModel({
      ...createDto,
      optionId: new Types.ObjectId(createDto.optionId),
    });
    return choice.save();
  }

  async findAllByOptionId(optionId: string): Promise<OptionChoiceSeparate[]> {
    return this.optionChoiceModel
      .find({ 
        optionId: new Types.ObjectId(optionId), 
        isActive: true 
      })
      .sort({ position: 1 })
      .exec();
  }

  async findById(id: string): Promise<OptionChoiceSeparate> {
    const choice = await this.optionChoiceModel.findById(id).exec();
    if (!choice) {
      throw new NotFoundException('Option choice not found');
    }
    return choice;
  }

  async update(id: string, updateDto: UpdateOptionChoiceSeparateDto): Promise<OptionChoiceSeparate> {
    const choice = await this.optionChoiceModel.findByIdAndUpdate(
      id,
      updateDto,
      { new: true }
    ).exec();

    if (!choice) {
      throw new NotFoundException('Option choice not found');
    }

    return choice;
  }

  async delete(id: string): Promise<void> {
    const result = await this.optionChoiceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Option choice not found');
    }
  }

  async deleteByOptionId(optionId: string): Promise<void> {
    await this.optionChoiceModel.deleteMany({ 
      optionId: new Types.ObjectId(optionId) 
    }).exec();
  }
}

