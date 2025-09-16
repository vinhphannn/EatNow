import { Body, Controller, Get, Param, Post, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterRestaurantDto } from './dto/register-restaurant.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Controller người dùng: đăng ký và liệt kê người dùng (cho admin)
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService, @InjectConnection() private readonly conn: Connection) {}

  // Đăng ký tài khoản khách hàng cơ bản
  @Post('register')
  @ApiBody({ type: RegisterCustomerDto })
  async register(@Body() body: RegisterCustomerDto) {
    return this.userService.registerCustomer(body);
  }

  // Đăng ký khách hàng (tường minh)
  @Post('register-customer')
  @ApiBody({ type: RegisterCustomerDto })
  async registerCustomer(@Body() body: RegisterCustomerDto) {
    return this.userService.registerCustomer(body);
  }

  // Đăng ký nhà hàng: tạo user role restaurant và bản ghi restaurant tối thiểu
  @Post('register-restaurant')
  @ApiBody({ type: RegisterRestaurantDto })
  async registerRestaurant(@Body() body: RegisterRestaurantDto) {
    return this.userService.registerRestaurant(body);
  }

  // Đăng ký tài xế: tạo user role driver và bản ghi driver trong collection drivers
  @Post('register-driver')
  @ApiBody({ type: RegisterDriverDto })
  async registerDriver(@Body() body: RegisterDriverDto) {
    const result = await this.userService.registerCustomer({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone,
    });
    // cập nhật role thành driver và tạo record driver
    const userModel = this.conn.model('User');
    await userModel.updateOne({ _id: result.id }, { $set: { role: 'driver' } });
    const driverModel = this.conn.model('Driver');
    await driverModel.create({ 
      userId: result.id, 
      name: body.name, 
      phone: body.phone,
      email: body.email,
      licenseNumber: body.licenseNumber,
      vehicleType: body.vehicleType,
      vehicleNumber: body.vehicleNumber,
      status: 'inactive' 
    });
    return { id: result.id, email: body.email, role: 'driver' };
  }

  // Trả về tất cả người dùng (demo). Thực tế cần auth + phân quyền admin.
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  // Lấy 1 người dùng theo email
  @Get(':email')
  async findOneByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  // Lấy thông tin người dùng hiện tại
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  async getMe(@Req() req: any) {
    return this.userService.getProfileById(req.user?.sub);
  }

  // Cập nhật thông tin người dùng hiện tại (name, phone, avatarUrl, addresses)
  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  async updateMe(@Req() req: any, @Body() body: any) {
    return this.userService.updateProfileById(req.user?.sub, body);
  }

  // Lấy thông tin profile driver (bao gồm thông tin driver)
  @UseGuards(JwtAuthGuard)
  @Get('me/driver-profile')
  async getDriverProfile(@Req() req: any) {
    return this.userService.getDriverProfileById(req.user?.sub);
  }
}


