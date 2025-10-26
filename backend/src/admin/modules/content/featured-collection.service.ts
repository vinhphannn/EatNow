import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeaturedCollection, FeaturedCollectionDocument } from './featured-collection.schema';
import { CreateFeaturedCollectionDto, UpdateFeaturedCollectionDto } from './featured-collection.dto';

@Injectable()
export class FeaturedCollectionService {
  constructor(
    @InjectModel(FeaturedCollection.name) 
    private featuredCollectionModel: Model<FeaturedCollectionDocument>,
  ) {}

  async create(createDto: CreateFeaturedCollectionDto): Promise<FeaturedCollection> {
    const featuredCollection = new this.featuredCollectionModel({
      ...createDto,
    });
    return featuredCollection.save();
  }

  async findAll(): Promise<FeaturedCollection[]> {
    return this.featuredCollectionModel
      .find()
      .sort({ position: 1, createdAt: -1 })
      .lean();
  }

  async findActive(): Promise<FeaturedCollection[]> {
    const now = new Date();
    return this.featuredCollectionModel
      .find({
        isActive: true,
        $and: [
          {
            $or: [
              { validFrom: { $exists: false } },
              { validFrom: { $lte: now } }
            ]
          },
          {
            $or: [
              { validUntil: { $exists: false } },
              { validUntil: { $gte: now } }
            ]
          }
        ]
      })
      .sort({ position: 1, createdAt: -1 })
      .lean();
  }

  async findOne(id: string): Promise<FeaturedCollection> {
    return this.featuredCollectionModel
      .findById(id)
      .lean();
  }

  async update(id: string, updateDto: UpdateFeaturedCollectionDto): Promise<FeaturedCollection> {
    const updateData: any = { ...updateDto };
    
    return this.featuredCollectionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean();
  }

  async remove(id: string): Promise<FeaturedCollection> {
    return this.featuredCollectionModel.findByIdAndDelete(id).lean();
  }

  async updatePosition(id: string, position: number): Promise<FeaturedCollection> {
    return this.featuredCollectionModel
      .findByIdAndUpdate(id, { position }, { new: true })
      .lean();
  }
}
