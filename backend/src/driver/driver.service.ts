import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';

@Injectable()
export class DriverService {
  constructor(@InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>) {}

  async findAll() {
    const docs = await this.driverModel
      .find({}, { name: 1, phone: 1, status: 1, userId: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return docs.map((d: any) => ({
      id: d._id,
      name: d.name,
      phone: d.phone,
      status: d.status,
      userId: d.userId,
      createdAt: d.createdAt,
    }));
  }
}


