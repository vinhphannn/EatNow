import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).lean();
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, (user as any).password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return { id: (user as any)._id, email: user.email, role: (user as any).role };
  }

  async login(email: string, password: string) {
    const u = await this.validateUser(email, password);
    const token = await this.jwt.signAsync({ sub: u.id, role: u.role, email: u.email });
    return { access_token: token, user: u };
  }
}


