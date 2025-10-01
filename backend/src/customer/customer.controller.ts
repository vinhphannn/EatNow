import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerService } from './customer.service';
import { RestaurantService } from '../restaurant/restaurant.service';

@ApiTags('customer')
@Controller('customer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly restaurantService: RestaurantService
  ) {}

  // Get customer profile
  @Get('profile')
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiResponse({ status: 200, description: 'Customer profile retrieved successfully' })
  async getProfile(@Request() req) {
    return this.customerService.getCustomerByUserId(req.user.id);
  }

  // Update customer profile
  @Put('profile')
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({ status: 200, description: 'Customer profile updated successfully' })
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.customerService.updateCustomer(req.user.id, updateData);
  }

  // Get customer statistics
  @Get('stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({ status: 200, description: 'Customer statistics retrieved successfully' })
  async getStats(@Request() req) {
    return this.customerService.getCustomerStats(req.user.id);
  }

  // Address management
  @Post('addresses')
  @ApiOperation({ summary: 'Add new address' })
  @ApiResponse({ status: 201, description: 'Address added successfully' })
  async addAddress(@Request() req, @Body() addressData: any) {
    return this.customerService.addAddress(req.user.id, addressData);
  }

  @Put('addresses/:index')
  @ApiOperation({ summary: 'Update address by index' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  async updateAddress(@Request() req, @Param('index') index: number, @Body() addressData: any) {
    return this.customerService.updateAddress(req.user.id, index, addressData);
  }

  @Delete('addresses/:index')
  @ApiOperation({ summary: 'Delete address by index' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  async deleteAddress(@Request() req, @Param('index') index: number) {
    return this.customerService.deleteAddress(req.user.id, index);
  }

  // Favorite restaurants
  @Post('favorites/restaurants/:restaurantId')
  @ApiOperation({ summary: 'Add restaurant to favorites' })
  @ApiResponse({ status: 201, description: 'Restaurant added to favorites' })
  async addFavoriteRestaurant(@Request() req, @Param('restaurantId') restaurantId: string) {
    return this.customerService.addFavoriteRestaurant(req.user.id, restaurantId);
  }

  @Delete('favorites/restaurants/:restaurantId')
  @ApiOperation({ summary: 'Remove restaurant from favorites' })
  @ApiResponse({ status: 200, description: 'Restaurant removed from favorites' })
  async removeFavoriteRestaurant(@Request() req, @Param('restaurantId') restaurantId: string) {
    return this.customerService.removeFavoriteRestaurant(req.user.id, restaurantId);
  }

  // Favorite items
  @Post('favorites/items/:itemId')
  @ApiOperation({ summary: 'Add item to favorites' })
  @ApiResponse({ status: 201, description: 'Item added to favorites' })
  async addFavoriteItem(
    @Request() req, 
    @Param('itemId') itemId: string, 
    @Body() body: { restaurantId: string }
  ) {
    return this.customerService.addFavoriteItem(req.user.id, itemId, body.restaurantId);
  }

  @Delete('favorites/items/:itemId')
  @ApiOperation({ summary: 'Remove item from favorites' })
  @ApiResponse({ status: 200, description: 'Item removed from favorites' })
  async removeFavoriteItem(@Request() req, @Param('itemId') itemId: string) {
    return this.customerService.removeFavoriteItem(req.user.id, itemId);
  }

  // Public restaurant endpoints (moved from old controller)
  @Get('restaurants')
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiOperation({ summary: 'Get public restaurants' })
  async getRestaurants(
    @Query('category') category?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    return this.restaurantService.findAllPublicRestaurants({ 
      limit, 
      skip,
      category 
    });
  }
}
