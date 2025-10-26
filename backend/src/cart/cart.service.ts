import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { ItemOptionSeparateService } from '../restaurant/item-option-separate.service';
import { OptionChoiceSeparateService } from '../restaurant/option-choice-separate.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    private readonly itemOptionService: ItemOptionSeparateService,
    private readonly optionChoiceService: OptionChoiceSeparateService,
  ) {}

  // Lấy giỏ hàng của user cho nhà hàng cụ thể
  async getCart(userId: string, restaurantId: string) {
    const cart = await this.cartModel.findOne({ 
      userId, 
      restaurantId
    }).lean();

    if (!cart) {
      return {
        userId,
        restaurantId,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        itemCount: 0
      };
    }

    return cart;
  }

  // Thêm món vào giỏ hàng
  async addItem(userId: string, restaurantId: string, itemData: {
    itemId: string;
    quantity: number;
    options?: Array<{
      optionId: string;
      choices: Array<{ choiceId: string; quantity: number }>;
    }>;
  }) {
    console.log('🛒 CartService.addItem called with:', { userId, restaurantId, itemData });
    // Kiểm tra item có tồn tại không
    const item = await this.itemModel.findById(itemData.itemId);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Kiểm tra item thuộc nhà hàng đúng không
    if (item.restaurantId.toString() !== restaurantId) {
      throw new BadRequestException('Item does not belong to this restaurant');
    }

    // Kiểm tra nhà hàng có active không
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant || restaurant.status !== 'active') {
      throw new BadRequestException('Restaurant is not active');
    }

    // Tìm hoặc tạo giỏ hàng
    let cart = await this.cartModel.findOne({ 
      userId, 
      restaurantId
    });

    if (!cart) {
      cart = new this.cartModel({
        userId,
        restaurantId,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        itemCount: 0
      });
    }

    // Xây dựng options với snapshot data
    const cartItemOptions = [];
    if (itemData.options && itemData.options.length > 0) {
      try {
        for (const optionData of itemData.options) {
          const option = await this.itemOptionService.findById(optionData.optionId);
          if (!option) {
            console.warn(`Option ${optionData.optionId} not found, skipping`);
            continue;
          }

          const optionChoices = [];
          let optionTotalPrice = 0;

          for (const choiceData of optionData.choices) {
            const choice = await this.optionChoiceService.findById(choiceData.choiceId);
            if (!choice) {
              console.warn(`Choice ${choiceData.choiceId} not found, skipping`);
        continue;
      }

            const choicePrice = choice.price * choiceData.quantity;
            optionTotalPrice += choicePrice;

            optionChoices.push({
              choiceId: (choice as any)._id,
              name: choice.name,
              price: choice.price,
              quantity: choiceData.quantity
            });
          }

          cartItemOptions.push({
            optionId: (option as any)._id,
            name: option.name,
            type: option.type,
            required: option.required,
            choices: optionChoices,
            totalPrice: optionTotalPrice
          });
        }
      } catch (error) {
        console.warn('Error processing options:', error.message);
        // Continue without options if there's an error
      }
    }

    // Tính toán giá
    const subtotal = item.price * itemData.quantity;
    const optionsTotalPrice = cartItemOptions.reduce((sum, opt) => sum + opt.totalPrice, 0);
    const totalPrice = subtotal + optionsTotalPrice;

    // Tạo cart item
    const cartItem = {
      itemId: item._id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: itemData.quantity,
      options: cartItemOptions,
      subtotal,
      totalPrice
    };

    // Thêm item mới (không so sánh, mỗi lần thêm tạo object riêng biệt)
    cart.items.push(cartItem);

    // Cập nhật tổng
    this.updateCartTotals(cart);

    try {
      return await cart.save();
    } catch (error) {
      console.error('Error saving cart:', error);
      throw new BadRequestException('Failed to save cart: ' + error.message);
    }
  }

  // Cập nhật số lượng món trong giỏ
  async updateQuantity(userId: string, restaurantId: string, itemId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const cart = await this.cartModel.findOne({ 
      userId, 
      restaurantId
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const itemIndex = cart.items.findIndex(item => item.itemId.toString() === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].subtotal = cart.items[itemIndex].price * quantity;
    
    // Recalculate total price including options
    const optionsTotalPrice = cart.items[itemIndex].options.reduce((sum, opt) => sum + opt.totalPrice, 0);
    cart.items[itemIndex].totalPrice = cart.items[itemIndex].subtotal + optionsTotalPrice;

    this.updateCartTotals(cart);

    return await cart.save();
  }

  // Xóa món khỏi giỏ hàng
  async removeItem(userId: string, restaurantId: string, itemId: string) {
    const cart = await this.cartModel.findOne({ 
      userId, 
      restaurantId
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.itemId.toString() !== itemId);

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Item not found in cart');
    }

    this.updateCartTotals(cart);

    return await cart.save();
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(userId: string, restaurantId: string) {
    const cart = await this.cartModel.findOne({ 
      userId, 
      restaurantId
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;
    cart.itemCount = 0;

    return await cart.save();
  }

  // Checkout - đổi status thành checked_out
  async checkout(userId: string, restaurantId: string) {
    const cart = await this.cartModel.findOne({ 
      userId, 
      restaurantId
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Xóa cart sau khi checkout
    await this.cartModel.deleteOne({ _id: cart._id });
    return { message: 'Cart cleared after checkout' };
  }

  // Lấy tất cả giỏ hàng của user
  async getUserCarts(userId: string) {
    return await this.cartModel.find({ 
      userId
    }).populate('restaurantId', 'name imageUrl').lean();
  }

  // Helper methods

  private updateCartTotals(cart: any) {
    cart.totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    cart.itemCount = cart.items.length;
  }
}