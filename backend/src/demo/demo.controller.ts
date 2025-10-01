import { Controller, Get, Post } from '@nestjs/common';
import { DemoService } from './demo.service';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  // API: tạo dữ liệu mẫu nhanh
  @Post('seed')
  async seed() {
    // Chú ý: môi trường dev dùng tạm, production không nên mở endpoint này
    return this.demoService.seed();
  }

  // API: danh sách nhà hàng kèm menu rút gọn cho front trình diễn
  @Get('restaurants')
  async restaurants() {
    return this.demoService.getRestaurantsWithMenu();
  }

  // API: tạo demo driver để test
  @Post('create-driver')
  async createDemoDriver() {
    return this.demoService.createDemoDriver();
  }
}


