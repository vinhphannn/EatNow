import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':restaurantId')
  @Roles('customer')
  @ApiOperation({ summary: 'Get cart for specific restaurant' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  async getCart(
    @Request() req: any,
    @Param('restaurantId') restaurantId: string,
  ) {
    const userId = req.user.id;
    return await this.cartService.getCart(userId, restaurantId);
  }

  @Post(':restaurantId/items')
  @Roles('customer')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully' })
  async addItem(
    @Request() req: any,
    @Param('restaurantId') restaurantId: string,
    @Body() body: {
      itemId: string;
      quantity: number;
      options?: Array<{
        optionId: string;
        choices: Array<{ choiceId: string; quantity: number }>;
      }>;
    },
  ) {
    const userId = req.user.id;
    return await this.cartService.addItem(userId, restaurantId, body);
  }

  @Put(':restaurantId/items/:itemId')
  @Roles('customer')
  @ApiOperation({ summary: 'Update item quantity in cart' })
  @ApiResponse({ status: 200, description: 'Item quantity updated successfully' })
  async updateQuantity(
    @Request() req: any,
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number },
  ) {
    const userId = req.user.id;
    return await this.cartService.updateQuantity(userId, restaurantId, itemId, body.quantity);
  }

  @Delete(':restaurantId/items/:itemId')
  @Roles('customer')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart successfully' })
  async removeItem(
    @Request() req: any,
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    const userId = req.user.id;
    return await this.cartService.removeItem(userId, restaurantId, itemId);
  }

  @Delete(':restaurantId/clear')
  @Roles('customer')
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  async clearCart(
    @Request() req: any,
    @Param('restaurantId') restaurantId: string,
  ) {
    const userId = req.user.id;
    return await this.cartService.clearCart(userId, restaurantId);
  }

  @Post(':restaurantId/checkout')
  @Roles('customer')
  @ApiOperation({ summary: 'Checkout cart' })
  @ApiResponse({ status: 200, description: 'Cart checked out successfully' })
  async checkout(
    @Request() req: any,
    @Param('restaurantId') restaurantId: string,
  ) {
    const userId = req.user.id;
    return await this.cartService.checkout(userId, restaurantId);
  }

  @Get('user/all')
  @Roles('customer')
  @ApiOperation({ summary: 'Get all user carts' })
  @ApiResponse({ status: 200, description: 'User carts retrieved successfully' })
  async getUserCarts(
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return await this.cartService.getUserCarts(userId);
  }
}