import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('restaurants')
  async searchRestaurants(
    @Query('q') query: string,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0'
  ): Promise<any> {
    return this.searchService.searchRestaurants(query, parseInt(limit), parseInt(offset));
  }

  @Get('items')
  async searchItems(
    @Query('q') query: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0'
  ): Promise<any> {
    return this.searchService.searchItems(query, parseInt(limit), parseInt(offset));
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async searchAll(
    @Query('q') query: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0'
  ): Promise<any> {
    return this.searchService.searchAll(query, parseInt(limit), parseInt(offset));
  }
}