import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Post('reindex-items')
  async reindex() {
    return this.search.reindexAll();
  }

  @Get('items')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'size', required: false, type: Number })
  async items(@Query('q') q = '', @Query('restaurantId') restaurantId?: string, @Query('size') size?: string) {
    const n = Math.max(1, Math.min(20, Number(size) || 10));
    return this.search.searchItems(q, restaurantId, n);
  }
}
