# Enhanced Order Schema Documentation

## 📋 **Tổng quan**

Schema đơn hàng được nâng cấp để lưu trữ chi tiết hơn, tương tự như cấu trúc giỏ hàng, bao gồm:

- **Order Items** với options chi tiết
- **Pricing breakdown** đầy đủ
- **Delivery tracking** nâng cao
- **Customer feedback** system
- **Order history** và analytics

## 🏗️ **Cấu trúc Schema**

### **1. OrderItemOptionChoice**
```typescript
{
  choiceId: ObjectId,        // Reference to OptionChoiceSeparate
  name: string,             // Snapshot: tên lựa chọn
  price: number,            // Snapshot: giá lựa chọn
  quantity: number          // Số lượng lựa chọn
}
```

### **2. OrderItemOption**
```typescript
{
  optionId: ObjectId,       // Reference to ItemOptionSeparate
  name: string,            // Snapshot: tên option
  type: 'single' | 'multiple',
  required: boolean,
  choices: OrderItemOptionChoice[],
  totalPrice: number       // Tổng giá của option
}
```

### **3. OrderItem**
```typescript
{
  itemId: ObjectId,         // Reference to Item
  name: string,            // Snapshot: tên món
  price: number,          // Snapshot: giá món
  imageUrl?: string,      // Snapshot: hình ảnh
  description?: string,   // Snapshot: mô tả
  quantity: number,       // Số lượng
  options: OrderItemOption[], // Các tùy chọn
  subtotal: number,       // = quantity * price
  totalPrice: number,     // = subtotal + sum(options.totalPrice)
  specialInstructions?: string // Ghi chú đặc biệt
}
```

### **4. Order (Enhanced)**
```typescript
{
  // Basic Info
  customerId: ObjectId,
  restaurantId: ObjectId,
  items: OrderItem[],
  
  // Pricing Breakdown
  subtotal: number,        // Tổng giá món ăn
  deliveryFee: number,     // Phí giao hàng
  tip: number,            // Thưởng tài xế
  doorFee: number,        // Phí cửa
  discount: number,       // Giảm giá
  finalTotal: number,     // Tổng cuối cùng
  
  // Delivery Address
  deliveryAddress: {
    label: string,
    addressLine: string,
    latitude: number,
    longitude: number,
    note?: string,
    _id?: ObjectId         // Reference to saved address
  },
  
  // Recipient Info
  recipientName: string,
  recipientPhonePrimary: string,
  recipientPhoneSecondary?: string,
  purchaserPhone?: string,
  
  // Order Details
  paymentMethod: 'cash' | 'bank_transfer',
  status: OrderStatus,
  specialInstructions?: string,
  deliveryMode: 'immediate' | 'scheduled',
  scheduledAt?: Date,
  
  // Voucher
  voucherCode?: string,
  voucherId?: ObjectId,
  
  // Driver Assignment
  driverId?: ObjectId,
  estimatedDeliveryTime?: Date,
  actualDeliveryTime?: Date,
  
  // Distance
  distanceToRestaurant?: number,
  distanceToCustomer?: number,
  deliveryDistance?: number,
  
  // Tracking
  orderCode?: string,
  trackingHistory: Array<{
    status: string,
    timestamp: Date,
    note?: string,
    updatedBy: string
  }>,
  
  // Restaurant Response
  acceptedAt?: Date,
  rejectedAt?: Date,
  rejectionReason?: string,
  
  // Customer Feedback
  customerRating?: number,
  customerReview?: string,
  
  // System Metadata
  orderSource?: string,    // 'web', 'mobile', 'api'
  ipAddress?: string,
  userAgent?: string
}
```

## 🔄 **Migration Process**

### **1. Chạy Migration Script**
```bash
cd backend
node scripts/migrate-order-schema.js
```

### **2. Cập nhật Frontend**
- Sử dụng API endpoints mới: `/api/v1/orders-enhanced`
- Cập nhật interface để match với schema mới
- Xử lý options và pricing breakdown

### **3. Cập nhật Backend**
- Import `OrderEnhancedModule` vào `AppModule`
- Sử dụng `OrderEnhancedService` thay vì `OrderService`
- Cập nhật notification gateway để sử dụng schema mới

## 📊 **API Endpoints**

### **Tạo đơn hàng**
```http
POST /api/v1/orders-enhanced
Content-Type: application/json

{
  "restaurantId": "68db6c57ac778a9cb703afd9",
  "deliveryAddress": {
    "label": "Nhà riêng",
    "addressLine": "123 Đường ABC",
    "latitude": 10.762622,
    "longitude": 106.660172,
    "note": "Tầng 2, căn hộ 201"
  },
  "recipient": {
    "name": "Nguyễn Văn A",
    "phone": "0123456789"
  },
  "paymentMethod": "cash",
  "deliveryMode": "immediate",
  "tip": 10000,
  "doorFee": 5000,
  "specialInstructions": "Giao vào giờ nghỉ trưa"
}
```

### **Lấy chi tiết đơn hàng**
```http
GET /api/v1/orders-enhanced/:id
```

### **Lấy đơn hàng theo nhà hàng**
```http
GET /api/v1/orders-enhanced/restaurant/:restaurantId?status=pending&page=1&limit=20
```

### **Cập nhật trạng thái**
```http
PATCH /api/v1/orders-enhanced/:id/status
Content-Type: application/json

{
  "status": "accepted",
  "note": "Đơn hàng đã được chấp nhận"
}
```

## 🎯 **Lợi ích**

### **1. Chi tiết hơn**
- Lưu trữ đầy đủ thông tin options
- Pricing breakdown rõ ràng
- Tracking history đầy đủ

### **2. Linh hoạt hơn**
- Hỗ trợ nhiều loại delivery
- Voucher system
- Customer feedback

### **3. Analytics tốt hơn**
- Thống kê chi tiết
- Performance metrics
- Business insights

### **4. Tương thích ngược**
- Migration script an toàn
- Không ảnh hưởng dữ liệu cũ
- Gradual rollout

## 🚀 **Next Steps**

1. **Test Migration**: Chạy migration trên dev environment
2. **Update Frontend**: Cập nhật checkout và order pages
3. **Update Backend**: Sử dụng OrderEnhancedService
4. **Deploy**: Rollout từng bước
5. **Monitor**: Theo dõi performance và errors

## 📝 **Notes**

- Schema mới tương thích với cấu trúc giỏ hàng hiện tại
- Migration script bảo toàn dữ liệu cũ
- Có thể chạy song song với schema cũ trong quá trình transition
- Indexes được tối ưu cho performance
