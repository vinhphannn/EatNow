import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { UserService } from '../user/user.service';
import { Customer, CustomerDocument } from '../customer/schemas/customer.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import * as bcrypt from 'bcryptjs';
import { Request } from 'express';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UserService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(RefreshToken.name) private readonly refreshModel: Model<RefreshTokenDocument>,
  ) {}

  // Helper function to get cookie names based on role
  private getCookieNames(role: string) {
    const rolePrefix = role.toLowerCase();
    return {
      accessToken: `${rolePrefix}_access_token`,
      refreshToken: `${rolePrefix}_refresh_token`,
      csrfToken: `${rolePrefix}_csrf_token`
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.users.findUserDocByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, (user as any).password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return { id: (user as any)._id, email: user.email, role: (user as any).role };
  }

  async login(email: string, password: string) {
    const u = await this.validateUser(email, password);
    const token = await this.jwt.signAsync({ sub: u.id, role: u.role, email: u.email });
    
    // Lấy thông tin user đầy đủ từ database
    const fullUser = await this.users.findByIdLean(u.id);

    // Auto-create customer profile on login if missing (for legacy users)
    if ((u as any).role === 'customer') {
      try {
        const existingCustomer = await this.customerModel.findOne({ userId: (fullUser as any)?._id });
        if (!existingCustomer) {
          const customer = new this.customerModel({
            userId: (fullUser as any)?._id,
            phone: (fullUser as any)?.phone,
          });
          await customer.save();
          await this.users.setById((fullUser as any)?._id, { customerProfile: (customer as any)._id });
        }
      } catch (e) {
        // Do not block login on customer creation failure; log in console in runtime
      }
    } else if ((u as any).role === 'driver') {
      // Ensure driver profile exists and is linked for driver role on login as well
      try {
        let driver = await this.driverModel.findOne({ userId: (fullUser as any)?._id }).lean();
        if (!driver) {
          const created = await this.driverModel.create({
            userId: (fullUser as any)?._id,
            status: 'inactive',
          } as any);
          driver = created?.toObject?.() || (created as any);
        }
        if (driver?._id) {
          await this.users.setById((fullUser as any)?._id, { driverProfile: (driver as any)._id });
        }
      } catch (e) {
        // Do not block login if driver profile creation fails
      }
    }
    
    return { 
      access_token: token, 
      user: {
        id: u.id.toString(), // Convert ObjectId to string
        email: u.email,
        role: u.role,
        name: (fullUser as any)?.name || (fullUser as any)?.fullName || u.email,
        avatar: (fullUser as any)?.avatarUrl,
        phone: (fullUser as any)?.phone,
        createdAt: (fullUser as any)?.createdAt,
        updatedAt: (fullUser as any)?.updatedAt,
      }
    };
  }

  async register(email: string, password: string, name: string, phone: string, role: string) {
    // Check if user already exists
    const existingUser = await this.users.findUserDocByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create user via UserService
      const user = await this.users.createUserBasic({
        email,
        passwordHash: hashedPassword,
        name,
        phone,
        role,
      });
      console.log('✅ User saved successfully:', (user as any)._id);

      // Create role-specific profile
      if (role === 'customer') {
        console.log('🔧 Creating customer profile for user:', (user as any)._id);
        try {
          const customer = new this.customerModel({
            userId: (user as any)._id,
            name: name,
            fullName: name,
            phone: phone,
          });

          await customer.save();
          console.log('✅ Customer profile created:', customer._id);

          // Update user to reference customer profile
          await this.users.setById((user as any)._id, { customerProfile: (customer as any)._id });
          console.log('✅ User linked to customer profile');
        } catch (error) {
          console.error('❌ Error creating customer profile:', error);
          // Don't throw error, just log it
        }
      } else if (role === 'restaurant') {
        try {
          // Nếu đã có restaurant cho user này thì dùng lại
          let restaurant = await this.restaurantModel.findOne({ ownerUserId: (user as any)._id }).lean();
          if (!restaurant) {
            const created = await this.restaurantModel.create({
              ownerUserId: (user as any)._id,
              name: name || 'Nhà hàng của tôi',
              status: 'pending',
              joinedAt: new Date(),
            });
            restaurant = created as any;
          }
          await this.users.setById((user as any)._id, { restaurantProfile: (restaurant as any)._id });
        } catch (error) {
          // Không chặn đăng ký nếu tạo restaurant thất bại
        }
      } else if (role === 'driver') {
        try {
          // Create and link driver profile tied to this user
          let driver = await this.driverModel.findOne({ userId: (user as any)._id }).lean();
          if (!driver) {
            const created = await this.driverModel.create({
              userId: (user as any)._id,
              status: 'inactive',
              ordersCompleted: 0,
              ordersRejected: 0,
            } as any);
            driver = created?.toObject?.() || (created as any);
          }
          if (driver?._id) {
            await this.users.setById((user as any)._id, { driverProfile: (driver as any)._id });
          }
        } catch (error) {
          // Don't block registration if driver creation fails
        }
      }

      // Generate token
      const token = await this.jwt.signAsync({ 
        sub: (user as any)._id, 
        role: user.role, 
        email: user.email 
      });

      return {
        access_token: token,
        user: {
          id: (user as any)._id,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Registration failed: ' + error.message);
    }
  }

  async refreshFromCookie() {
    // Deprecated by rotateRefreshToken
    const payload = { sub: 'unknown', role: 'customer', email: 'unknown@eatnow.com' };
    const access = await this.jwt.signAsync(payload, { expiresIn: '15m' });
    return { access_token: access };
  }

  async getProfileFromCookie(req: Request) {
    // Try to find token from any role-specific cookie
    const cookies = req.cookies || {};
    let token: string | undefined;
    
    // Check all possible cookie names
    for (const role of ['customer', 'restaurant', 'driver', 'admin']) {
      const cookieNames = this.getCookieNames(role);
      if (cookies[cookieNames.accessToken]) {
        token = cookies[cookieNames.accessToken];
        break;
      }
    }
    
    // Fallback to generic access_token
    if (!token) {
      token = cookies['access_token'];
    }
    
    if (!token) throw new UnauthorizedException('Missing token');
    try {
      const payload = await this.jwt.verifyAsync(token);
      const user = await this.users.findByIdLean(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');
      return {
        id: (user as any)._id.toString(),
        email: (user as any).email,
        name: (user as any).name || (user as any).fullName || (user as any).email,
        role: (user as any).role,
      };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private hmac(raw: string) {
    const secret = process.env.REFRESH_HMAC_SECRET || process.env.JWT_SECRET || 'dev-secret';
    return createHmac('sha256', secret).update(raw).digest('hex');
  }

  private mintAccessToken(user: any) {
    return this.jwt.signAsync({ sub: user.id || user._id, role: user.role, email: user.email }, { expiresIn: '15m' });
  }

  private async mintRefreshToken(user: any, req: Request) {
    const jti = randomBytes(16).toString('hex');
    const raw = randomBytes(48).toString('hex') + '.' + jti;
    const tokenHash = this.hmac(raw);
    const csrf = randomBytes(16).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.refreshModel.create({
      userId: (user as any)._id || user.id,
      jti,
      tokenHash,
      parentJti: (req as any).parentJti,
      deviceId: (req as any).headers['x-device-id'] as string,
      userAgent: req.headers['user-agent'],
      ip: (req as any).ip || (req as any).headers['x-forwarded-for'],
      status: 'active',
      expiresAt: expires,
      csrf,
    });
    return { raw, jti, csrf };
  }

  async rotateRefreshToken(req: Request) {
    // Try to find refresh token from any role-specific cookie
    const cookies = (req as any).cookies || {};
    let raw: string | undefined;
    
    // Check all possible cookie names
    for (const role of ['customer', 'restaurant', 'driver', 'admin']) {
      const cookieNames = this.getCookieNames(role);
      if (cookies[cookieNames.refreshToken]) {
        raw = cookies[cookieNames.refreshToken];
        break;
      }
    }
    
    // Fallback to generic refresh_token
    if (!raw) {
      raw = cookies['refresh_token'];
    }
    
    if (!raw) throw new UnauthorizedException('Missing refresh token');
    const [tokenPart, jti] = String(raw).split('.');
    if (!tokenPart || !jti) throw new UnauthorizedException('Invalid refresh token');
    const tokenHash = this.hmac(raw);
    const doc = await this.refreshModel.findOne({ jti }).lean();
    if (!doc) throw new UnauthorizedException('Invalid token');
    // constant-time compare
    const ok = (() => {
      try { return timingSafeEqual(Buffer.from(doc.tokenHash), Buffer.from(tokenHash)); } catch { return false; }
    })();
    if (!ok) throw new UnauthorizedException('Invalid token');
    if ((doc as any).status !== 'active') {
      // reuse detected
      await this.revokeAllForUser((doc as any).userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (!doc) throw new UnauthorizedException('Invalid or rotated token');
    const user = await this.users.findByIdLean((doc as any).userId);
    if (!user) throw new UnauthorizedException('User not found');

    // rotate: mark old as rotated
    const updated = await this.refreshModel.updateOne({ jti, status: 'active' }, { $set: { status: 'rotated', rotatedAt: new Date() } });
    if ((updated as any).modifiedCount === 0) {
      await this.revokeAllForUser((doc as any).userId);
      throw new UnauthorizedException('Refresh token replay');
    }
    // issue new pair
    const access_token = await this.mintAccessToken(user);
    (req as any).parentJti = jti;
    const { raw: newRaw, csrf } = await this.mintRefreshToken(user, req);
    return { access_token, refresh_token: newRaw, csrf };
  }

  async revokeCurrentRefreshToken(req: Request) {
    // Try to find refresh token from any role-specific cookie
    const cookies = (req as any).cookies || {};
    let raw: string | undefined;
    
    // Check all possible cookie names
    for (const role of ['customer', 'restaurant', 'driver', 'admin']) {
      const cookieNames = this.getCookieNames(role);
      if (cookies[cookieNames.refreshToken]) {
        raw = cookies[cookieNames.refreshToken];
        break;
      }
    }
    
    // Fallback to generic refresh_token
    if (!raw) {
      raw = cookies['refresh_token'];
    }
    
    if (!raw) return { ok: true };
    const [tokenPart, jti] = String(raw).split('.');
    if (!tokenPart || !jti) return { ok: true };
    await this.refreshModel.updateOne({ jti }, { $set: { status: 'revoked', revokedAt: new Date() } });
    return { ok: true };
  }

  private async revokeAllForUser(userId: any) {
    await this.refreshModel.updateMany({ userId }, { $set: { status: 'revoked', revokedAt: new Date() } });
  }
}
