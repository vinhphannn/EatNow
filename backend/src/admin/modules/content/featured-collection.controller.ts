import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { FeaturedCollectionService } from './featured-collection.service';
import { CreateFeaturedCollectionDto, UpdateFeaturedCollectionDto } from './featured-collection.dto';

@Controller('admin/featured-collections')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class FeaturedCollectionController {
  constructor(private readonly featuredCollectionService: FeaturedCollectionService) {}

  @Post()
  create(@Body() createDto: CreateFeaturedCollectionDto) {
    return this.featuredCollectionService.create(createDto);
  }

  @Get()
  findAll() {
    return this.featuredCollectionService.findAll();
  }

  @Get('active')
  findActive() {
    return this.featuredCollectionService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featuredCollectionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateFeaturedCollectionDto) {
    return this.featuredCollectionService.update(id, updateDto);
  }

  @Put(':id/position')
  updatePosition(@Param('id') id: string, @Body('position') position: number) {
    return this.featuredCollectionService.updatePosition(id, position);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.featuredCollectionService.remove(id);
  }
}
