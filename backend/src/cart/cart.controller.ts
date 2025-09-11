import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(
    @Request() req: any,
    @Body() body: { itemId: string; quantity?: number; specialInstructions?: string }
  ) {
    const userId = req.user.id;
    return await this.cartService.addToCart(
      userId,
      body.itemId,
      body.quantity || 1,
      body.specialInstructions
    );
  }

  @Get()
  async getCart(@Request() req: any) {
    const userId = req.user.id;
    return await this.cartService.getCart(userId);
  }

  @Get('summary')
  async getCartSummary(@Request() req: any) {
    const userId = req.user.id;
    return await this.cartService.getCartSummary(userId);
  }

  @Put(':id')
  async updateCartItem(
    @Param('id') cartItemId: string,
    @Body() body: { quantity: number; specialInstructions?: string }
  ) {
    return await this.cartService.updateCartItem(
      cartItemId,
      body.quantity,
      body.specialInstructions
    );
  }

  @Delete(':id')
  async removeFromCart(@Param('id') cartItemId: string) {
    return await this.cartService.removeFromCart(cartItemId);
  }

  @Delete()
  async clearCart(@Request() req: any) {
    const userId = req.user.id;
    return await this.cartService.clearCart(userId);
  }
}
