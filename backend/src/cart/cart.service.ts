import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  async addToCart(
    userId: string,
    itemId: string,
    quantity: number = 1,
    specialInstructions?: string
  ) {
    // Validate item exists and is active
    const item = await this.itemModel.findById(itemId).lean();
    if (!item || !item.isActive) {
      throw new NotFoundException('Item not found or not available');
    }

    // Check if item already in cart
    const existingCartItem = await this.cartModel.findOne({
      userId,
      itemId,
      isActive: true
    }).lean();

    if (existingCartItem) {
      // Update quantity
      const updatedCart = await this.cartModel.findByIdAndUpdate(
        existingCartItem._id,
        { 
          quantity: existingCartItem.quantity + quantity,
          specialInstructions: specialInstructions || existingCartItem.specialInstructions
        },
        { new: true }
      ).lean();

      return {
        id: String(updatedCart._id),
        itemId: String(updatedCart.itemId),
        quantity: updatedCart.quantity,
        specialInstructions: updatedCart.specialInstructions
      };
    } else {
      // Add new item to cart
      const newCartItem = await this.cartModel.create({
        userId,
        itemId,
        restaurantId: item.restaurantId,
        quantity,
        specialInstructions
      });

      return {
        id: String(newCartItem._id),
        itemId: String(newCartItem.itemId),
        quantity: newCartItem.quantity,
        specialInstructions: newCartItem.specialInstructions
      };
    }
  }

  async getCart(userId: string) {
    const cartItems = await this.cartModel
      .find({ userId, isActive: true })
      .populate('itemId', 'name price type description imageUrl imageId rating')
      .populate('restaurantId', 'name address')
      .lean();

    return cartItems.map(item => ({
      id: String(item._id),
      item: {
        id: String(item.itemId._id),
        name: item.itemId.name,
        price: item.itemId.price,
        type: item.itemId.type,
        description: item.itemId.description,
        imageUrl: item.itemId.imageUrl,
        imageId: item.itemId.imageId,
        rating: item.itemId.rating || 0
      },
      restaurant: {
        id: String(item.restaurantId._id),
        name: item.restaurantId.name,
        address: item.restaurantId.address
      },
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
      subtotal: item.itemId.price * item.quantity
    }));
  }

  async updateCartItem(cartItemId: string, quantity: number, specialInstructions?: string) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const updatedCart = await this.cartModel.findByIdAndUpdate(
      cartItemId,
      { 
        quantity,
        specialInstructions: specialInstructions !== undefined ? specialInstructions : undefined
      },
      { new: true }
    ).lean();

    if (!updatedCart) {
      throw new NotFoundException('Cart item not found');
    }

    return {
      id: String(updatedCart._id),
      itemId: String(updatedCart.itemId),
      quantity: updatedCart.quantity,
      specialInstructions: updatedCart.specialInstructions
    };
  }

  async removeFromCart(cartItemId: string) {
    // Use hard delete to avoid unique index collisions on (userId, itemId, isActive)
    const result = await this.cartModel.findByIdAndDelete(cartItemId);
    if (!result) {
      throw new NotFoundException('Cart item not found');
    }
    return { success: true };
  }

  async clearCart(userId: string) {
    // Use hard delete to avoid unique index collisions on (userId, itemId, isActive)
    await this.cartModel.deleteMany({ userId });
    return { success: true };
  }

  async getCartSummary(userId: string) {
    const cartItems = await this.getCart(userId);
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const restaurantCount = new Set(cartItems.map(item => item.restaurant.id)).size;

    return {
      totalItems,
      totalAmount,
      restaurantCount,
      items: cartItems
    };
  }
}
