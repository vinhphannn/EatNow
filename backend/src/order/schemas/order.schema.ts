import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',                    // Chờ xác nhận từ nhà hàng
  CONFIRMED = 'confirmed',                // Nhà hàng đã xác nhận và đang chuẩn bị
  READY = 'ready',                        // Sẵn sàng giao (tài xế có thể nhận)
  PICKING_UP = 'picking_up',             // Tài xế đã nhận đơn và đang đến lấy hàng
  ARRIVED_AT_RESTAURANT = 'arrived_at_restaurant', // Tài xế đã đến nhà hàng
  PICKED_UP = 'picked_up',                // Tài xế đã lấy đơn hàng
  ARRIVED_AT_CUSTOMER = 'arrived_at_customer',     // Tài xế đã đến vị trí giao hàng
  DELIVERED = 'delivered',                // Đơn hàng đã giao thành công
  CANCELLED = 'cancelled',                // Đơn hàng đã bị hủy
}

export enum PaymentMethod {
  CASH = 'cash',
  WALLET = 'wallet', // Thanh toán bằng ví EatNow
}

// Schema cho từng lựa chọn trong option
@Schema({ _id: false })
export class OrderItemOptionChoice {
  @Prop({ type: Types.ObjectId, ref: 'OptionChoiceSeparate', required: true })
  choiceId: Types.ObjectId; // ID của lựa chọn trong database

  @Prop({ required: true })
  name: string; // Tên lựa chọn (VD: "Size L", "Thêm phô mai")

  @Prop({ required: true })
  price: number; // Giá của lựa chọn này

  @Prop({ default: 1, min: 1 })
  quantity: number; // Số lượng lựa chọn này
}

// Schema cho từng option group
@Schema({ _id: false })
export class OrderItemOption {
  @Prop({ type: Types.ObjectId, ref: 'ItemOptionSeparate', required: true })
  optionId: Types.ObjectId; // ID của nhóm option trong database

  @Prop({ required: true })
  name: string; // Tên nhóm option (VD: "Size", "Topping")

  @Prop({ required: true, enum: ['single', 'multiple'] })
  type: string; // Loại option (chọn 1 hoặc nhiều)

  @Prop({ required: true })
  required: boolean; // Bắt buộc phải chọn hay không

  @Prop({ type: [OrderItemOptionChoice], default: [] })
  choices: OrderItemOptionChoice[]; // Danh sách các lựa chọn trong nhóm

  @Prop({ required: true })
  totalPrice: number; // Tổng giá của tất cả lựa chọn trong nhóm
}

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Item' })
  itemId: Types.ObjectId; // ID món ăn trong database

  @Prop({ required: true })
  name: string; // Tên món ăn

  @Prop({ required: true })
  price: number; // Giá gốc của món ăn

  @Prop()
  imageUrl?: string; // URL hình ảnh món ăn

  @Prop({ required: true })
  quantity: number; // Số lượng món ăn

  @Prop({ type: [OrderItemOption], default: [] })
  options: OrderItemOption[]; // Danh sách các option đã chọn

  @Prop({ required: true })
  subtotal: number; // Tạm tính (price * quantity)

  @Prop({ required: true })
  totalPrice: number; // Tổng tiền (subtotal + options)

  @Prop({ default: '' })
  specialInstructions?: string; // Ghi chú đặc biệt cho món này
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Customer' })
  customerId: Types.ObjectId; // ID khách hàng đặt đơn

  @Prop({ required: true, type: Types.ObjectId, ref: 'Restaurant' })
  restaurantId: Types.ObjectId; // ID nhà hàng cung cấp món ăn

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[]; // Danh sách món ăn trong đơn hàng

  @Prop({ required: true })
  subtotal: number; // Tạm tính tiền món ăn (chưa bao gồm phí ship và tip)

  @Prop({ required: true })
  deliveryFee: number; // Phí giao hàng cơ bản

  @Prop({ default: 0 })
  tip: number; // Thưởng cho tài xế từ khách hàng

  @Prop({ default: 0 })
  doorFee: number; // Phí giao tận cửa (+5k)

  @Prop({ required: true })
  finalTotal: number; // Tổng cộng cuối cùng khách phải trả

  // === CÁC TRƯỜNG TIỀN THU VÀ CHIẾT KHẤU MỚI ===
  
   /**
    * VÍ DỤ TÍNH TOÁN CỤ THỂ:
    * 
    * Giả sử có đơn hàng:
    * - subtotal: 150,000đ (tiền món ăn)
    * - deliveryFee: 20,000đ (phí giao hàng)
    * - tip: 10,000đ (thưởng tài xế)
    * - doorFee: 5,000đ (phí giao tận cửa)
    * - platformFeeRate: 10% (phí platform từ quán)
    * - driverCommissionRate: 30% (chiết khấu tài xế từ phí ship)
    * 
    * Tính toán:
    * - platformFeeAmount = 150,000 * 10% = 15,000đ
    * - driverCommissionAmount = 20,000 * 30% = 6,000đ
    * - finalTotal = 150,000 + 20,000 + 10,000 + 5,000 = 185,000đ
    * - customerPayment = 185,000đ (khách trả số này)
    * - restaurantRevenue = 150,000 - 15,000 = 135,000đ (quán nhận)
    * - driverPayment = 20,000 + 10,000 + 5,000 - 6,000 = 29,000đ (tài xế nhận)
    */
  
  /**
   * Tiền thu từ khách hàng
   * - Giá trị: Số tiền khách hàng thực tế phải trả
   * - Công thức: finalTotal (đã bao gồm tất cả phí và chiết khấu)
   * - Ví dụ: 180,000đ (khách trả đúng số này)
   * - Lưu ý: Khác với finalTotal ở chỗ đây là số tiền thực thu được
   */
  @Prop({ required: true })
  customerPayment: number;

  /**
   * Tiền quán nhận được
   * - Giá trị: Số tiền quán thực nhận sau khi trừ phí platform
   * - Công thức: subtotal - platformFeeAmount
   * - Ví dụ: 150,000đ - 15,000đ = 135,000đ
   * - Lưu ý: Không bao gồm phí giao hàng và tip (đã trả cho tài xế)
   */
  @Prop({ required: true })
  restaurantRevenue: number;

  /**
   * Tiền trả cho tài xế
   * - Giá trị: Tổng số tiền tài xế nhận được
   * - Công thức: deliveryFee + tip + doorFee - driverCommissionAmount
   * - Ví dụ: 20,000đ + 10,000đ + 5,000đ - 6,000đ = 29,000đ
   * - Lưu ý: Bao gồm cả phí giao hàng (sau khi trừ chiết khấu 30%) và thưởng từ khách
   */
  @Prop({ required: true })
  driverPayment: number;

  /**
   * Tỷ lệ phí dịch vụ platform (%)
   * - Giá trị: Phần trăm phí platform thu từ quán
   * - Đơn vị: Phần trăm (VD: 10 = 10%, 2.5 = 2.5%)
   * - Ví dụ: 10 (platform thu 10% từ doanh thu quán)
   * - Lưu ý: Chỉ thu từ tiền món ăn, không thu từ phí giao hàng
   */
  @Prop({ default: 0 })
  platformFeeRate: number;

  /**
   * Số tiền phí dịch vụ platform (VND)
   * - Giá trị: Số tiền platform thu được từ quán
   * - Công thức: subtotal * (platformFeeRate / 100)
   * - Ví dụ: 150,000đ * (10/100) = 15,000đ
   * - Lưu ý: Được tính tự động từ platformFeeRate
   */
  @Prop({ default: 0 })
  platformFeeAmount: number;

  /**
   * Tỷ lệ chiết khấu tài xế (%)
   * - Giá trị: Phần trăm platform thu từ phí giao hàng
   * - Đơn vị: Phần trăm (VD: 30 = 30%)
   * - Ví dụ: 30 (platform thu 30% từ phí ship)
   * - Lưu ý: Chỉ áp dụng cho phí giao hàng, không áp dụng cho tip và doorFee
   */
  @Prop({ default: 30 })
  driverCommissionRate: number;

  /**
   * Số tiền chiết khấu tài xế (VND)
   * - Giá trị: Số tiền platform thu từ phí giao hàng
   * - Công thức: deliveryFee * (driverCommissionRate / 100)
   * - Ví dụ: 20,000đ * (30/100) = 6,000đ
   * - Lưu ý: Được tính tự động từ driverCommissionRate
   */
  @Prop({ default: 0 })
  driverCommissionAmount: number;

  @Prop({
    type: {
      label: { type: String, required: true },
      addressLine: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      note: { type: String },
      recipientName: { type: String, required: true },
      recipientPhone: { type: String, required: true },
    },
    required: true,
  })
  deliveryAddress: {
    label: string; // Nhãn địa chỉ (VD: "Nhà", "Công ty")
    addressLine: string; // Địa chỉ chi tiết để giao hàng
    latitude: number; // Vĩ độ GPS của địa chỉ giao hàng
    longitude: number; // Kinh độ GPS của địa chỉ giao hàng
    note?: string; // Ghi chú thêm về địa chỉ
    recipientName: string; // Tên người nhận hàng
    recipientPhone: string; // Số điện thoại người nhận hàng
  };

  @Prop({ default: '' })
  specialInstructions: string; // Ghi chú đặc biệt cho toàn bộ đơn hàng

  // Purchaser contact info (người đặt hàng)
  @Prop({ required: true })
  purchaserPhone: string; // Số điện thoại người đặt hàng (có thể khác người nhận)

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod; // Phương thức thanh toán (tiền mặt/chuyển khoản)

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus; // Trạng thái hiện tại của đơn hàng

  @Prop({ default: 'immediate' })
  deliveryMode: string; // Chế độ giao hàng (ngay lập tức/đặt lịch)

  @Prop({ default: null })
  scheduledAt?: Date; // Thời gian giao hàng theo lịch (nếu đặt lịch)

  @Prop({ default: '' })
  voucherCode?: string; // Mã voucher/giảm giá được áp dụng

  @Prop({ type: Types.ObjectId, ref: 'Driver', default: null })
  driverId?: Types.ObjectId; // ID tài xế được phân công (null nếu chưa có)

  @Prop({ default: null })
  estimatedDeliveryTime?: Date; // Thời gian giao hàng dự kiến

  @Prop({ default: null })
  actualDeliveryTime?: Date; // Thời gian giao hàng thực tế

  // Distance calculation (in kilometers)
  @Prop({ default: null })
  deliveryDistance?: number; // Khoảng cách giao hàng tính bằng km

  // Restaurant coordinates for driver reference
  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    default: null,
  })
  restaurantCoordinates?: {
    latitude: number; // Vĩ độ GPS của nhà hàng
    longitude: number; // Kinh độ GPS của nhà hàng
  };

  // Driver assignment info
  @Prop({ default: null })
  assignedAt?: Date; // Thời gian phân công tài xế cho đơn hàng

  @Prop({ default: null })
  driverRating?: number; // Đánh giá tài xế (ẩn khỏi tài xế)

  @Prop({ unique: true, sparse: true })
  code?: string; // Mã đơn hàng duy nhất (VD: "ORD001")

  @Prop({
    type: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, required: true },
        note: { type: String },
        updatedBy: { type: String }, // 'system', 'restaurant', 'driver', 'customer'
      },
    ],
    default: [],
  })
  trackingHistory?: Array<{
    status: string; // Trạng thái đơn hàng tại thời điểm đó
    timestamp: Date; // Thời gian cập nhật trạng thái
    note?: string; // Ghi chú khi cập nhật trạng thái
    updatedBy?: string; // Ai đã cập nhật trạng thái
  }>;
}

// Tạo schemas theo thứ tự từ trong ra ngoài
export const OrderItemOptionChoiceSchema = SchemaFactory.createForClass(OrderItemOptionChoice);
export const OrderItemOptionSchema = SchemaFactory.createForClass(OrderItemOption);
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
export const OrderSchema = SchemaFactory.createForClass(Order);