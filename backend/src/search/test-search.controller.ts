import { Controller, Get, Query } from '@nestjs/common';

@Controller('api/v1/test-search')
export class TestSearchController {
  @Get('restaurants')
  async searchRestaurants(
    @Query('q') query: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0'
  ) {
    return {
      success: true,
      message: 'Test search endpoint works!',
      query,
      limit: parseInt(limit),
      offset: parseInt(offset),
      restaurants: []
    };
  }

  @Get('items')
  async searchItems(
    @Query('q') query: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0'
  ) {
    return {
      success: true,
      message: 'Test search endpoint works!',
      query,
      limit: parseInt(limit),
      offset: parseInt(offset),
      items: []
    };
  }
}
