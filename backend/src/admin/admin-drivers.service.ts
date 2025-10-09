import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AdminDriversService {
  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async list({ page = 1, limit = 20, q, status, sort }: any) {
    // Base on Driver docs so drivers show even if user doesn't have specific role flags
    const driverFilter: any = {};
    if (status) driverFilter.status = status;

    // If searching by q, first find matching users and filter drivers by those userIds
    let userIdAllowList: Types.ObjectId[] | null = null;
    if (q) {
      const matchedUsers = await this.userModel.find({
        $or: [
          { email: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
        ],
      }, { _id: 1 }).lean();
      userIdAllowList = matchedUsers.map((u: any) => new Types.ObjectId(String(u._id)));
      if (userIdAllowList.length > 0) {
        driverFilter.userId = { $in: userIdAllowList };
      } else {
        // No matches, short-circuit
        return { data: [], page: Number(page), limit: Number(limit), total: 0 };
      }
    }

    const sortSpec = (() => {
      if (!sort) return { createdAt: -1 } as any;
      const [field, dir] = String(sort).split(':');
      return { [field]: dir === 'desc' ? -1 : 1 } as any;
    })();

    const [drivers, total] = await Promise.all([
      this.driverModel
        .find(driverFilter, { userId: 1, status: 1, createdAt: 1, isAuto: 1 })
        .sort(sortSpec)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      this.driverModel.countDocuments(driverFilter),
    ]);

    const userIds = Array.from(new Set(drivers.map((d: any) => String(d.userId)).filter(Boolean))).map((id) => new Types.ObjectId(id));
    const users = userIds.length
      ? await this.userModel
          .find({ _id: { $in: userIds } }, { name: 1, email: 1, phone: 1 })
          .lean()
      : [];
    const userMap = new Map(users.map((u: any) => [String(u._id), u]));

    const data = drivers.map((d: any) => {
      const u = d.userId ? userMap.get(String(d.userId)) : null;
      return {
        id: String(d._id),
        userId: d.userId ? String(d.userId) : undefined,
        name: u?.name || u?.email || 'N/A',
        phone: u?.phone,
        status: d.status,
        createdAt: d.createdAt,
        isAuto: !!d.isAuto,
      };
    });

    return { data, page: Number(page), limit: Number(limit), total };
  }

  async findOne(id: string) {
    const d: any = await this.driverModel.findById(id).lean();
    if (!d) return null;
    const u = d.userId ? await this.userModel.findById(d.userId, { email: 1, name: 1, phone: 1, isActive: 1 }).lean() : null;
    return {
      id: String(d._id),
      userId: d.userId ? String(d.userId) : undefined,
      status: d.status,
      createdAt: d.createdAt,
      user: u ? { id: String(u._id), email: u.email, name: u.name, phone: u.phone, isActive: u.isActive } : null,
      metrics: { completed: d.ordersCompleted || 0, rating: d.rating || 0 },
    } as any;
  }

  async update(id: string, payload: { status?: string; isAuto?: boolean }) {
    const d = await this.driverModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!d) return null;
    return { id: String(d._id), status: d.status, isAuto: !!d.isAuto } as any;
  }
}


