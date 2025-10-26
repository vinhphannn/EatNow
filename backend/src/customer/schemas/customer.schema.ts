import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

/**
 * Schema cho thông tin khách hàng
 * Lưu trữ thông tin chi tiết của người dùng với vai trò customer
 * 
 * LƯU Ý: Các thông tin cơ bản như name, phone, avatarUrl, dateOfBirth, gender, bio,
 * isActive, isPhoneVerified, lastLoginAt, lastActiveAt, language, country, timezone,
 * currency, allowPushNotifications, allowEmailNotifications, allowSMSNotifications,
 * allowMarketingEmails, allowLocationTracking, failedLoginAttempts, lockedUntil,
 * passwordChangedAt, passwordHistory, deviceTokens, lastDeviceInfo, isDeleted,
 * deletedAt, dataRetentionUntil đã được lưu trong User schema để tránh trùng lặp dữ liệu
 */
@Schema({ timestamps: true })
export class Customer {
  // ========== LIÊN KẾT VỚI USER ==========
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId; // Tham chiếu đến User schema (1-1 relationship)

  // ========== QUẢN LÝ ĐỊA CHỈ ==========
  /**
   * Danh sách địa chỉ giao hàng của khách hàng
   * Mỗi khách hàng có thể có nhiều địa chỉ (nhà, chỗ làm, nhà bạn...)
   */
  @Prop({
    type: [
      {
        label: { type: String, required: true }, // Nhãn địa chỉ: "Nhà", "Chỗ làm", "Nhà bạn"
        addressLine: { type: String, required: true }, // Địa chỉ chi tiết: "123 Đường ABC, Quận 1"
        latitude: { type: Number, required: true }, // Tọa độ GPS - vĩ độ
        longitude: { type: Number, required: true }, // Tọa độ GPS - kinh độ
        note: { type: String }, // Ghi chú thêm cho địa chỉ
        isDefault: { type: Boolean, default: false }, // Địa chỉ mặc định khi checkout
        phone: { type: String }, // SĐT người nhận tại địa chỉ này
        recipientName: { type: String }, // Tên người nhận tại địa chỉ này
        isActive: { type: Boolean, default: true }, // Địa chỉ còn sử dụng không
      },
    ],
    default: [],
  })
  addresses?: Array<{
    label: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    note?: string;
    isDefault?: boolean;
    phone?: string;
    recipientName?: string;
    isActive?: boolean;
  }>;

  /**
   * Danh sách nhãn địa chỉ có sẵn cho khách hàng chọn
   * Giúp khách hàng dễ dàng phân loại địa chỉ
   */
  @Prop({
    type: [String],
    default: ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
  })
  addressLabels?: string[];

  // ========== SỞ THÍCH ẨM THỰC ==========
  /**
   * Danh sách món ăn yêu thích của khách hàng
   * Dùng để gợi ý món ăn phù hợp
   */
  @Prop({ type: [String], default: [] })
  favoriteCuisines?: string[]; // Ví dụ: ["Việt Nam", "Hàn Quốc", "Nhật Bản"]

  /**
   * Hạn chế ăn uống của khách hàng
   * Dùng để lọc món ăn phù hợp
   */
  @Prop({ type: [String], default: [] })
  dietaryRestrictions?: string[]; // Ví dụ: ["Vegetarian", "Vegan", "Halal", "Kosher"]

  /**
   * Danh sách dị ứng của khách hàng
   * Dùng để cảnh báo món ăn có thể gây dị ứng
   */
  @Prop({ type: [String], default: [] })
  allergens?: string[]; // Ví dụ: ["Đậu phộng", "Hải sản", "Sữa", "Trứng"]

  /**
   * Độ cay khách hàng có thể chịu được (0-5)
   * 0: Không cay, 5: Rất cay
   */
  @Prop({ default: 0 })
  spiceLevel: number;

  // ========== THỐNG KÊ ĐƠN HÀNG ==========
  /**
   * Tổng số đơn hàng đã đặt
   * Dùng để tính toán cấp độ thành viên
   */
  @Prop({ default: 0 })
  totalOrders: number;

  /**
   * Tổng số tiền đã chi tiêu
   * Dùng để tính toán cấp độ thành viên và ưu đãi
   */
  @Prop({ default: 0 })
  totalSpent: number;

  /**
   * Tổng số lượt đánh giá đã thực hiện
   * Dùng để hiển thị mức độ tích cực của khách hàng
   */
  @Prop({ default: 0 })
  totalReviews: number;

  /**
   * Giá trị đơn hàng trung bình
   * Dùng để phân tích hành vi mua hàng
   */
  @Prop({ default: 0 })
  averageOrderValue: number;

  /**
   * Điểm tích lũy của khách hàng
   * Có thể đổi thành voucher hoặc ưu đãi
   */
  @Prop({ default: 0 })
  loyaltyPoints: number;

  /**
   * Cấp độ thành viên của khách hàng
   * bronze: Đồng, silver: Bạc, gold: Vàng, platinum: Bạch kim
   */
  @Prop({ default: 'bronze' })
  loyaltyTier: string;

  // ========== HỆ THỐNG GIỚI THIỆU ==========
  /**
   * Người đã giới thiệu khách hàng này
   * Dùng để tính hoa hồng giới thiệu
   */
  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  referredBy?: Types.ObjectId;

  /**
   * Số người đã được khách hàng này giới thiệu
   * Dùng để tính hoa hồng giới thiệu
   */
  @Prop({ default: 0 })
  referralCount: number;

  /**
   * Tổng tiền thưởng từ việc giới thiệu
   * Dùng để hiển thị thu nhập từ giới thiệu
   */
  @Prop({ default: 0 })
  referralEarnings: number;

  // ========== THÔNG TIN CÁ NHÂN CỤ THỂ ==========
  /**
   * Sở thích và cài đặt cá nhân của khách hàng
   * Lưu trữ các thông tin chi tiết về sở thích
   */
  @Prop({ type: Object })
  preferences?: {
    favoriteRestaurants?: Types.ObjectId[]; // Danh sách nhà hàng yêu thích
    favoriteItems?: Types.ObjectId[]; // Danh sách món ăn yêu thích
    preferredDeliveryTime?: string; // Giờ giao hàng yêu thích
    preferredPaymentMethod?: string; // Phương thức thanh toán yêu thích
    deliveryInstructions?: string; // Hướng dẫn giao hàng đặc biệt
  };

  /**
   * Thông tin đăng nhập mạng xã hội
   * Dùng để liên kết tài khoản với các nền tảng khác
   */
  @Prop({ type: Object })
  socialInfo?: {
    facebookId?: string; // ID Facebook
    googleId?: string; // ID Google
    appleId?: string; // ID Apple
    linkedInId?: string; // ID LinkedIn
  };

  /**
   * Thông tin đăng ký dịch vụ premium
   * Dùng để quản lý gói dịch vụ cao cấp
   */
  @Prop({ type: Object })
  subscriptionInfo?: {
    isSubscribed?: boolean; // Có đăng ký dịch vụ premium không
    subscriptionType?: string; // Loại gói đăng ký
    subscriptionStartDate?: Date; // Ngày bắt đầu đăng ký
    subscriptionEndDate?: Date; // Ngày kết thúc đăng ký
    autoRenew?: boolean; // Tự động gia hạn
  };

  // ========== PHÂN TÍCH VÀ THEO DÕI ==========
  /**
   * Dữ liệu phân tích hành vi mua hàng
   * Dùng để tối ưu hóa trải nghiệm khách hàng
   */
  @Prop({ type: Object })
  analytics?: {
    lastOrderDate?: Date; // Ngày đặt hàng cuối cùng
    favoriteOrderTime?: string; // Giờ đặt hàng yêu thích
    averageOrderFrequency?: number; // Tần suất đặt hàng (ngày giữa các đơn)
    totalDeliveryFees?: number; // Tổng phí giao hàng đã trả
    totalServiceFees?: number; // Tổng phí dịch vụ đã trả
    totalDiscounts?: number; // Tổng tiền giảm giá đã nhận
    cancellationRate?: number; // Tỷ lệ hủy đơn hàng
  };

  /**
   * Lịch sử đơn hàng chi tiết
   * Dùng để hiển thị lịch sử mua hàng
   */
  @Prop({ type: [Object] })
  orderHistory?: Array<{
    orderId: Types.ObjectId; // ID đơn hàng
    restaurantId: Types.ObjectId; // ID nhà hàng
    totalAmount: number; // Tổng tiền đơn hàng
    orderDate: Date; // Ngày đặt hàng
    status: string; // Trạng thái đơn hàng
    rating?: number; // Đánh giá (1-5 sao)
  }>;

  /**
   * Danh sách nhà hàng yêu thích
   * Dùng để gợi ý nhà hàng phù hợp
   */
  @Prop({ type: [Object] })
  favoriteRestaurants?: Array<{
    restaurantId: Types.ObjectId; // ID nhà hàng
    addedAt: Date; // Ngày thêm vào yêu thích
    orderCount: number; // Số lần đặt hàng tại nhà hàng này
    lastOrderDate?: Date; // Ngày đặt hàng cuối cùng
  }>;

  /**
   * Danh sách món ăn yêu thích
   * Dùng để gợi ý món ăn phù hợp
   */
  @Prop({ type: [Object] })
  favoriteItems?: Array<{
    itemId: Types.ObjectId; // ID món ăn
    restaurantId: Types.ObjectId; // ID nhà hàng
    addedAt: Date; // Ngày thêm vào yêu thích
    orderCount: number; // Số lần đặt món này
    lastOrderDate?: Date; // Ngày đặt món cuối cùng
  }>;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// ========== INDEXES CHO TỐI ƯU TRUY VẤN ==========
/**
 * Các chỉ mục được tạo để tối ưu hóa hiệu suất truy vấn
 */

// Tìm kiếm nhanh theo userId (unique)
CustomerSchema.index({ userId: 1 }, { unique: true });

// Tìm kiếm theo trạng thái hoạt động
CustomerSchema.index({ isActive: 1 });

// Tìm kiếm theo trạng thái xác thực SĐT
CustomerSchema.index({ isPhoneVerified: 1 });

// Sắp xếp theo ngày đăng nhập cuối (mới nhất trước)
CustomerSchema.index({ lastLoginAt: -1 });

// Sắp xếp theo ngày tạo (mới nhất trước)
CustomerSchema.index({ createdAt: -1 });

// Sắp xếp theo cấp độ thành viên và điểm tích lũy
CustomerSchema.index({ loyaltyTier: 1, loyaltyPoints: -1 });

// Sắp xếp theo tổng số đơn hàng (nhiều nhất trước)
CustomerSchema.index({ totalOrders: -1 });

// Sắp xếp theo tổng chi tiêu (nhiều nhất trước)
CustomerSchema.index({ totalSpent: -1 });

// Tìm kiếm theo người giới thiệu
CustomerSchema.index({ referredBy: 1 });

// Tìm kiếm theo trạng thái xóa và ngày xóa
CustomerSchema.index({ isDeleted: 1, deletedAt: 1 });

// Tìm kiếm theo vị trí địa lý (geospatial index)
CustomerSchema.index({ 'addresses.latitude': 1, 'addresses.longitude': 1 });

// Tìm kiếm theo nhà hàng yêu thích
CustomerSchema.index({ 'preferences.favoriteRestaurants': 1 });

// Tìm kiếm theo món ăn yêu thích
CustomerSchema.index({ 'preferences.favoriteItems': 1 });