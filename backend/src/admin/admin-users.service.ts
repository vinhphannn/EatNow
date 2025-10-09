import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async list({ page = 1, limit = 20, q, role, status, sort }: any) {
    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.status = status; // if schema has status
    if (q) {
      // text or regex on email/name/phone
      filter.$or = [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const sortSpec = (() => {
      if (!sort) return { createdAt: -1 } as any;
      const [field, dir] = String(sort).split(':');
      return { [field]: dir === 'desc' ? -1 : 1 } as any;
    })();

    const [docs, total] = await Promise.all([
      this.userModel
        .find(filter, { email: 1, name: 1, phone: 1, role: 1, status: 1, createdAt: 1, lastLogin: 1 })
        .sort(sortSpec)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    const data = docs.map((d: any) => ({
      id: String(d._id),
      email: d.email,
      name: d.name,
      phone: d.phone,
      role: d.role,
      status: d.status,
      createdAt: d.createdAt,
      lastLogin: d.lastLogin,
    }));

    return { data, page: Number(page), limit: Number(limit), total };
  }

  async findOne(id: string) {
    const d: any = await this.userModel.findById(id, { email: 1, name: 1, phone: 1, role: 1, isActive: 1, createdAt: 1 }).lean();
    if (!d) return null;
    return {
      id: String(d._id),
      email: d.email,
      name: d.name,
      phone: d.phone,
      role: d.role,
      isActive: d.isActive,
      createdAt: d.createdAt,
    } as any;
  }

  async update(id: string, payload: { isActive?: boolean }) {
    const d = await this.userModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) return null;
    return { id: String(d._id), isActive: d.isActive } as any;
  }
}


