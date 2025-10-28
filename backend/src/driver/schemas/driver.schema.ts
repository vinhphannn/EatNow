import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Index } from 'typeorm';

export type DriverDocument = HydratedDocument<Driver>;

@Schema({ timestamps: true })
export class Driver {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: any;

  /**
   * Trạng thái làm việc của tài xế
   * - checkin: Đang làm việc (có thể nhận đơn)
   * - checkout: Tạm nghỉ (không nhận đơn)
   * - ban: Bị cấm (admin quyết định khi phát hiện lỗi)
   * 
   * Lưu ý: Tài xế chỉ có thể chuyển giữa checkin/checkout
   * Ban chỉ được admin set khi phát hiện lỗi và có thời gian ban
   */
  @Prop({ 
    enum: ['checkin', 'checkout', 'ban'], 
    default: 'checkout' 
  })
  status: 'checkin' | 'checkout' | 'ban';

  /**
   * Trạng thái giao hàng hiện tại
   * - null: Không có đơn hàng (sẵn sàng nhận đơn)
   * - 'delivering': Đang giao hàng (không nhận đơn mới)
   * 
   * Lưu ý: Trạng thái này được tự động cập nhật khi:
   * - Nhận đơn: currentOrderId được set → deliveryStatus = 'delivering'
   * - Hoàn thành đơn: currentOrderId = null → deliveryStatus = null
   */
  @Prop({ 
    enum: [null, 'delivering'], 
    default: null 
  })
  deliveryStatus: null | 'delivering';

  /**
   * Thông tin ban (chỉ admin mới có thể set)
   * - banReason: Lý do bị ban
   * - banUntil: Thời gian ban đến khi nào (null = ban vĩnh viễn)
   * - bannedBy: Admin nào đã ban
   * - bannedAt: Thời gian bị ban
   */
  @Prop({ type: Object, default: null })
  banInfo?: {
    reason: string;           // Lý do bị ban
    until?: Date;             // Ban đến khi nào (null = vĩnh viễn)
    bannedBy: Types.ObjectId; // Admin nào ban
    bannedAt: Date;           // Thời gian bị ban
  } | null;

  /**
   * Vị trí GPS hiện tại của tài xế
   * Format: [longitude, latitude]
   * Ví dụ: [105.8342, 21.0285] (Hà Nội)
   */
  @Prop({ type: [Number], default: [0, 0] })
  location: [number, number];

  /**
   * Thời gian cập nhật vị trí cuối cùng
   * Dùng để kiểm tra tài xế có đang online không
   */
  @Prop({ type: Date })
  lastLocationAt?: Date;

  /**
   * Thời gian check in cuối cùng
   * Dùng để theo dõi lịch sử làm việc
   */
  @Prop({ type: Date, default: null })
  lastCheckinAt?: Date;

  /**
   * Thời gian check out cuối cùng
   * Dùng để theo dõi lịch sử làm việc
   */
  @Prop({ type: Date, default: null })
  lastCheckoutAt?: Date;

  /**
   * ID đơn hàng hiện tại đang giao
   * - null: Không có đơn hàng (sẵn sàng nhận đơn)
   * - ObjectId: Đang giao đơn hàng này
   * 
   * Lưu ý: Khi có đơn hàng, deliveryStatus sẽ tự động = 'delivering'
   */
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  currentOrderId?: Types.ObjectId;

  /**
   * Thời gian bắt đầu giao đơn hàng hiện tại
   * Dùng để tính thời gian giao hàng và hiệu suất
   */
  @Prop({ type: Date })
  currentOrderStartedAt?: Date;

  /**
   * CHỈ SỐ HIỆU SUẤT CỦA TÀI XẾ
   * Dùng để tính điểm và ưu tiên khi gán đơn
   */
  
  /**
   * Số đơn hàng đã hoàn thành thành công
   * Tăng khi tài xế hoàn thành đơn hàng
   */
  @Prop({ default: 0 })
  ordersCompleted: number;

  /**
   * Số đơn hàng đã từ chối
   * Tăng khi tài xế từ chối nhận đơn
   */
  @Prop({ default: 0 })
  ordersRejected: number;

  /**
   * Số đơn hàng đã bỏ qua (không phản hồi)
   * Tăng khi tài xế không phản hồi thông báo đơn hàng
   */
  @Prop({ default: 0 })
  ordersSkipped: number;

  /**
   * Điểm đánh giá trung bình từ khách hàng
   * Range: 0-5 (0 = chưa có đánh giá)
   */
  @Prop({ default: 0 })
  rating: number;

  /**
   * Số lượt đánh giá đã nhận
   * Dùng để tính rating trung bình
   */
  @Prop({ default: 0 })
  ratingCount: number;

  /**
   * Số đơn giao đúng giờ hoặc sớm hơn
   * Tăng khi estimatedTime >= actualTime
   */
  @Prop({ default: 0 })
  onTimeDeliveries: number;

  /**
   * Số đơn giao trễ
   * Tăng khi actualTime > estimatedTime
   */
  @Prop({ default: 0 })
  lateDeliveries: number;

  /**
   * THÔNG TIN PHƯƠNG TIỆN
   */
  
  /**
   * Loại phương tiện
   * Ví dụ: 'xe_may', 'xe_dap', 'o_to', 'xe_tai'
   */
  @Prop()
  vehicleType?: string;

  /**
   * Biển số xe
   * Ví dụ: '29A1-12345'
   */
  @Prop()
  licensePlate?: string;

  /**
   * THÔNG TIN NGÂN HÀNG (để thanh toán phí giao hàng)
   */
  
  /**
   * Số tài khoản ngân hàng
   * Ví dụ: '1234567890'
   */
  @Prop()
  bankAccount?: string;

  /**
   * Tên ngân hàng
   * Ví dụ: 'Vietcombank', 'Techcombank'
   */
  @Prop()
  bankName?: string;

  /**
   * THỐNG KÊ CHI TIẾT
   */
  
  /**
   * Tổng số đơn hàng đã giao (alias của ordersCompleted)
   * Dùng để tính hiệu suất tổng thể
   */
  @Prop({ default: 0 })
  totalDeliveries: number;

  /**
   * Thời gian giao hàng trung bình (phút)
   * Tính từ lúc nhận đơn đến lúc hoàn thành
   */
  @Prop({ default: 0 })
  averageDeliveryTime: number;

  /**
   * Điểm hiệu suất tổng thể (0-100)
   * Tính từ rating, onTimeDeliveries, ordersCompleted
   */
  @Prop({ default: 0 })
  performanceScore: number;

  /**
   * THEO DÕI TẢI CÔNG VIỆC
   */
  
  /**
   * Số đơn hàng đang giao hiện tại
   * Thường = 0 hoặc 1 (tùy theo maxConcurrentOrders)
   */
  @Prop({ default: 0 })
  activeOrdersCount: number;

  /**
   * Số đơn hàng tối đa có thể gán cùng lúc
   * Default: 1 (hầu hết tài xế chỉ giao 1 đơn/lần)
   * Có thể tăng lên 2-3 cho tài xế kinh nghiệm
   */
  @Prop({ default: 1 })
  maxConcurrentOrders: number;

  /**
   * HIỆU SUẤT KHOẢNG CÁCH
   */
  
  /**
   * Khoảng cách trung bình mỗi đơn hàng (km)
   * Dùng để tối ưu hóa tuyến đường
   */
  @Prop({ default: 0 })
  averageDistancePerOrder: number;

  /**
   * Tổng quãng đường đã di chuyển (km)
   * Dùng để tính phí xăng và hao mòn xe
   */
  @Prop({ default: 0 })
  totalDistanceTraveled: number;

  /**
   * CHẾ ĐỘ TỰ ĐỘNG (cho development/testing)
   * Khi isAuto = true, tài xế sẽ tự động di chuyển và nhận đơn
   */
  
  /**
   * Có phải tài xế tự động không
   * true: Tài xế bot (cho test)
   * false: Tài xế thật
   */
  @Prop({ default: false })
  isAuto?: boolean;

  /**
   * Thông tin cấu hình cho tài xế tự động
   * - city: Thành phố hoạt động
   * - currentTarget: Điểm đến hiện tại (nhà hàng hoặc khách hàng)
   * - speedKmh: Tốc độ di chuyển (km/h)
   */
  @Prop({ type: Object, default: null })
  autoMeta?: {
    city?: string;
    currentTarget?: { lat: number; lng: number; type: 'restaurant' | 'customer' } | null;
    speedKmh?: number;
  } | null;

  /**
   * VÍ TIỀN TÀI XẾ
   * Lưu trữ phí giao hàng tích lũy chờ thanh toán
   */
  
  /**
   * Số dư ví (VNĐ)
   * Tích lũy từ phí giao hàng của các đơn đã hoàn thành
   * Admin có thể rút tiền cho tài xế
   */
  @Prop({ default: 0 })
  walletBalance: number;

}

export const DriverSchema = SchemaFactory.createForClass(Driver);

// Thêm unique index để đảm bảo một user chỉ có một driver record
DriverSchema.index({ userId: 1 }, { unique: true });


