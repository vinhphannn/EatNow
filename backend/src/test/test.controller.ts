import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/test')
export class TestController {
  @Get('search')
  async testSearch() {
    return {
      success: true,
      message: 'Test search endpoint works!',
      timestamp: new Date().toISOString()
    };
  }
}