import { Controller, Get, Post, Param, Body, Query, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { OwnershipGuard } from '../auth/ownership.guard';
import { UserService } from '../user/user.service';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService, private readonly userService: UserService) {}

  // Restaurants
  // Public endpoint: đăng ký nhà hàng CHỈ tạo bản ghi trong restaurants (không tạo user)
  @Post('register')
  async publicRegister(@Body() body: { name: string; description?: string; address?: string; openingHours?: string; ownerUserId?: string }) {
    return this.restaurantService.createRestaurant({
      name: body.name,
      ownerUserId: body.ownerUserId,
      description: body.description,
      address: body.address,
      openingHours: body.openingHours,
    } as any);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin','restaurant')
  @Post()
  async createRestaurant(@Body() body: { ownerUserId?: string; name: string }) {
    return this.restaurantService.createRestaurant(body);
  }

  @Get()
  @ApiQuery({ name: 'ownerUserId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query('ownerUserId') ownerUserId?: string, @Query('status') status?: string) {
    return this.restaurantService.findAllRestaurants({ ownerUserId, status });
  }

  // Lấy nhà hàng theo user hiện tại (đã auth)
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMine(@Param() _params: any, @Body() _body: any, @Query() _query: any, @Req() req: any) {
    const id = req?.user?.id || req?.user?.sub;
    if (!id) return null;
    return this.restaurantService.findOneByOwnerUserId(id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.restaurantService.getRestaurant(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles('admin','restaurant')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; status?: string }) {
    return this.restaurantService.updateRestaurant(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.restaurantService.deleteRestaurant(id);
  }

  // Categories
  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles('admin','restaurant')
  @Post(':restaurantId/categories')
  async createCategory(@Param('restaurantId') restaurantId: string, @Body() body: { name: string; position?: number }) {
    return this.restaurantService.createCategory(restaurantId, body);
  }

  @Get(':restaurantId/categories')
  async listCategories(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.listCategories(restaurantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles('admin','restaurant')
  @Patch('/categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: { name?: string; position?: number }) {
    return this.restaurantService.updateCategory(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles('admin','restaurant')
  @Delete('/categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.restaurantService.deleteCategory(id);
  }

  // Items
  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles('admin','restaurant')
  @Post(':restaurantId/items')
  async createItem(@Param('restaurantId') restaurantId: string, @Body() body: { name: string; price: number; type: 'food'|'drink'; categoryId?: string; description?: string; imageUrl?: string; isActive?: boolean; position?: number }) {
    return this.restaurantService.createItem(restaurantId, body);
  }

  @Get(':restaurantId/items')
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['position','createdAt','price'] as any })
  @ApiQuery({ name: 'order', required: false, enum: ['asc','desc'] as any })
  async listItems(
    @Param('restaurantId') restaurantId: string,
    @Query('type') type?: 'food'|'drink',
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: 'position'|'createdAt'|'price',
    @Query('order') order?: 'asc'|'desc',
  ) {
    return this.restaurantService.listItems(restaurantId, { type, categoryId, isActive, sortBy, order });
  }

  @Get('/items/:id')
  async getItem(@Param('id') id: string) {
    return this.restaurantService.getItem(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles('admin','restaurant')
  @Patch('/items/:id')
  async updateItem(@Param('id') id: string, @Body() body: any) {
    return this.restaurantService.updateItem(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles('admin','restaurant')
  @Delete('/items/:id')
  async deleteItem(@Param('id') id: string) {
    return this.restaurantService.deleteItem(id);
  }

  // Admin: duyệt/suspend nhà hàng
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.restaurantService.updateRestaurant(id, { status: 'active' });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/suspend')
  async suspend(@Param('id') id: string) {
    return this.restaurantService.updateRestaurant(id, { status: 'suspended' });
  }
}


