import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Create customer profile
  async createCustomer(userId: string, customerData: Partial<Customer>): Promise<Customer> {
    try {
      // Check if user exists
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if customer already exists
      const existingCustomer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (existingCustomer) {
        throw new BadRequestException('Customer profile already exists');
      }

      // Create customer profile
      const customer = new this.customerModel({
        userId: new Types.ObjectId(userId),
        name: user.name,
        email: user.email,
        ...customerData,
      });

      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Get customer by user ID
  async getCustomerByUserId(userId: string): Promise<Customer> {
    try {
      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .populate('userId', 'email name role')
        .lean();

      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      return customer;
    } catch (error) {
      throw error;
    }
  }

  // Get customer by ID
  async getCustomerById(customerId: string): Promise<Customer> {
    try {
      const customer = await this.customerModel
        .findById(customerId)
        .populate('userId', 'email name role')
        .lean();

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      return customer;
    } catch (error) {
      throw error;
    }
  }

  // Update customer profile
  async updateCustomer(userId: string, updateData: Partial<Customer>): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      return customer;
    } catch (error) {
      throw error;
    }
  }

  // Add address
  async addAddress(userId: string, addressData: any): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      // If this is the first address, set it as default
      if (customer.addresses.length === 0) {
        addressData.isDefault = true;
      }

      // If this address is set as default, unset others
      if (addressData.isDefault) {
        customer.addresses.forEach(addr => addr.isDefault = false);
      }

      customer.addresses.push(addressData);
      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Update address
  async updateAddress(userId: string, addressIndex: number, addressData: any): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
        throw new BadRequestException('Invalid address index');
      }

      // If this address is set as default, unset others
      if (addressData.isDefault) {
        customer.addresses.forEach((addr, index) => {
          if (index !== addressIndex) addr.isDefault = false;
        });
      }

      customer.addresses[addressIndex] = { ...customer.addresses[addressIndex], ...addressData };
      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Delete address
  async deleteAddress(userId: string, addressIndex: number): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
        throw new BadRequestException('Invalid address index');
      }

      const wasDefault = customer.addresses[addressIndex].isDefault;
      customer.addresses.splice(addressIndex, 1);

      // If we deleted the default address, set the first remaining as default
      if (wasDefault && customer.addresses.length > 0) {
        customer.addresses[0].isDefault = true;
      }

      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Get customer statistics
  async getCustomerStats(userId: string): Promise<any> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      return {
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        totalReviews: customer.totalReviews,
        averageOrderValue: customer.averageOrderValue,
        loyaltyPoints: customer.loyaltyPoints,
        loyaltyTier: customer.loyaltyTier,
        referralCount: customer.referralCount,
        referralEarnings: customer.referralEarnings,
        lastOrderDate: customer.analytics?.lastOrderDate,
        favoriteOrderTime: customer.analytics?.favoriteOrderTime,
        averageOrderFrequency: customer.analytics?.averageOrderFrequency,
      };
    } catch (error) {
      throw error;
    }
  }

  // Update customer statistics
  async updateCustomerStats(userId: string, statsData: any): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      // Update statistics
      if (statsData.totalOrders !== undefined) customer.totalOrders = statsData.totalOrders;
      if (statsData.totalSpent !== undefined) customer.totalSpent = statsData.totalSpent;
      if (statsData.totalReviews !== undefined) customer.totalReviews = statsData.totalReviews;
      if (statsData.averageOrderValue !== undefined) customer.averageOrderValue = statsData.averageOrderValue;
      if (statsData.loyaltyPoints !== undefined) customer.loyaltyPoints = statsData.loyaltyPoints;
      if (statsData.loyaltyTier !== undefined) customer.loyaltyTier = statsData.loyaltyTier;

      // Update analytics
      if (statsData.analytics) {
        customer.analytics = { ...customer.analytics, ...statsData.analytics };
      }

      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Add favorite restaurant
  async addFavoriteRestaurant(userId: string, restaurantId: string): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      // Check if already favorite
      const existingFavorite = customer.favoriteRestaurants?.find(
        fav => fav.restaurantId.toString() === restaurantId
      );

      if (existingFavorite) {
        throw new BadRequestException('Restaurant already in favorites');
      }

      if (!customer.favoriteRestaurants) {
        customer.favoriteRestaurants = [];
      }

      customer.favoriteRestaurants.push({
        restaurantId: new Types.ObjectId(restaurantId),
        addedAt: new Date(),
        orderCount: 0,
      });

      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Remove favorite restaurant
  async removeFavoriteRestaurant(userId: string, restaurantId: string): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      if (customer.favoriteRestaurants) {
        customer.favoriteRestaurants = customer.favoriteRestaurants.filter(
          fav => fav.restaurantId.toString() !== restaurantId
        );
      }

      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Add favorite item
  async addFavoriteItem(userId: string, itemId: string, restaurantId: string): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      // Check if already favorite
      const existingFavorite = customer.favoriteItems?.find(
        fav => fav.itemId.toString() === itemId
      );

      if (existingFavorite) {
        throw new BadRequestException('Item already in favorites');
      }

      if (!customer.favoriteItems) {
        customer.favoriteItems = [];
      }

      customer.favoriteItems.push({
        itemId: new Types.ObjectId(itemId),
        restaurantId: new Types.ObjectId(restaurantId),
        addedAt: new Date(),
        orderCount: 0,
      });

      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Remove favorite item
  async removeFavoriteItem(userId: string, itemId: string): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      if (customer.favoriteItems) {
        customer.favoriteItems = customer.favoriteItems.filter(
          fav => fav.itemId.toString() !== itemId
        );
      }

      return await customer.save();
    } catch (error) {
      throw error;
    }
  }

  // Get all customers (admin only)
  async getAllCustomers(limit: number = 10, skip: number = 0): Promise<Customer[]> {
    try {
      return await this.customerModel
        .find({ isDeleted: false })
        .populate('userId', 'email name role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    } catch (error) {
      throw error;
    }
  }

  // Delete customer (soft delete)
  async deleteCustomer(userId: string): Promise<Customer> {
    try {
      const customer = await this.customerModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!customer) {
        throw new NotFoundException('Customer profile not found');
      }

      customer.isDeleted = true;
      customer.deletedAt = new Date();
      customer.isActive = false;

      return await customer.save();
    } catch (error) {
      throw error;
    }
  }
}






