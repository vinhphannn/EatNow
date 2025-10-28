# 💳 Wallet & Payment System - Hoàn chỉnh

## ✅ Đã hoàn thành

### Backend Integration
- ✅ Wallet Service - Multi-actor support
- ✅ Payment Service - MoMo integration
- ✅ Order Service - Auto payment & distribution
- ✅ Platform fee được ẩn khỏi user/restaurant
- ✅ Tự động phân chia tiền khi đơn delivered

### Frontend
- ✅ Wallet Service - API calls
- ✅ Customer Wallet Page - Full UI
- ✅ Transaction History - Display & filters

### Tính năng chính

#### 1. **Customer Wallet**
- Nạp tiền qua MoMo
- Rút tiền ra MoMo
- Xem số dư khả dụng & đang chờ
- Lịch sử giao dịch đầy đủ

#### 2. **Order Payment Flow**
- Customer đặt đơn → Tạo payment transaction
- MoMo callback → Confirm payment
- Order status → confirmed
- Restaurant chuẩn bị → Driver nhận → Giao hàng
- **Auto distribute** khi delivered:
  - Restaurant nhận `restaurantRevenue`
  - Driver nhận `driverPayment`
  - Platform thu `platformFee`

#### 3. **Privacy & Security**
- Platform fee ẩn khỏi user/restaurant
- Chỉ Admin thấy platform fee details
- Tất cả transactions được log

---

## 📊 Kiến trúc Phân chia Tiền

### Khi đơn được đặt:

```
Customer trả: finalTotal (180,000 VND)
├─ subtotal: 150,000 VND
├─ deliveryFee: 20,000 VND
├─ tip: 10,000 VND
└─ doorFee: 0 VND
```

### Khi đơn delivered - Auto phân chia:

```
📦 Order Total: 180,000 VND
│
├─ 🏪 Restaurant: 135,000 VND
│   └─ 150,000 - 15,000 (platform fee 10%)
│
├─ 🚗 Driver: 26,000 VND
│   └─ (20,000 + 10,000) - 4,000 (commission 30%)
│
└─ 💼 Platform: 19,000 VND
    ├─ 15,000 (từ restaurant)
    └─ 4,000 (từ driver)
```

**Lưu ý quan trọng:**
- Restaurant chỉ thấy số tiền mình nhận được: `135,000 VND`
- Customer chỉ thấy số tiền phải trả: `180,000 VND`
- Platform fee `19,000 VND` **ẨN** khỏi họ
- Chỉ Admin dashboard hiển thị platform fee

---

## 🔄 Complete Flow

### 1. Customer Nạp Tiền
```
Customer click "Nạp tiền"
    ↓
POST /api/v1/payment/deposit
    ↓
Tạo transaction (pending)
    ↓
Gọi MoMo API → nhận paymentUrl
    ↓
Redirect đến MoMo
    ↓
Customer thanh toán trên MoMo
    ↓
MoMo callback → verify signature
    ↓
Update transaction (completed)
    ↓
Credit vào ví Customer
```

### 2. Thanh toán Đơn hàng
```
Customer đặt đơn
    ↓
POST /api/v1/orders/from-cart
    ↓
Tạo order (status: pending)
    ↓
POST /api/v1/payment/order (nếu momo)
    ↓
Nhận paymentUrl từ MoMo
    ↓
Customer thanh toán
    ↓
MoMo callback → confirm payment
    ↓
Order → status: confirmed
```

### 3. Auto Distribute Khi Delivered
```
Driver giao đơn thành công
    ↓
Order status → delivered
    ↓
Auto trigger: distributeOrderEarnings()
    ↓
Calculate earnings:
  - restaurantRevenue = subtotal - platformFee
  - driverPayment = (deliveryFee + tip) - commission
  - platformFeeAmount (internally)
    ↓
Credit vào ví:
  - Restaurant wallet += restaurantRevenue
  - Driver wallet += driverPayment
  - Platform wallet += platformFeeAmount
```

---

## 🗂️ Database Schema

### Orders Collection
```typescript
{
  // User-facing fields
  subtotal: 150000,
  deliveryFee: 20000,
  tip: 10000,
  finalTotal: 180000,
  
  // Revenue fields
  restaurantRevenue: 135000,    // ✅ Restaurant thấy này
  driverPayment: 26000,        // ✅ Driver thấy này
  platformFeeAmount: 19000,    // ❌ Ẩn khỏi user/restaurant
  platformFeeRate: 10,         // ❌ Ẩn khỏi user/restaurant
  
  // Status
  status: 'delivered'
}
```

### Wallet Transactions
```typescript
// Restaurant transaction
{
  type: 'order_revenue',
  amount: 135000,
  description: 'Nhận tiền từ đơn hàng #ORD001',
  status: 'completed',
  orderId: 'order_123',
  orderCode: 'ORD001'
}

// Driver transaction
{
  type: 'commission',
  amount: 26000,
  description: 'Nhận tiền từ đơn hàng #ORD001',
  status: 'completed',
  orderId: 'order_123'
}

// Platform transaction
{
  type: 'platform_fee',
  amount: 19000,
  description: 'Phí platform từ đơn hàng #ORD001',
  status: 'completed',
  isSystemTransaction: true
}
```

---

## 🎯 API Endpoints

### Customer APIs
```http
# Nạp tiền
POST /api/v1/payment/deposit
{ amount: 100000, provider: 'momo' }

# Rút tiền
POST /api/v1/payment/withdraw
{ amount: 50000, provider: 'momo', phoneNumber: '0937123456' }

# Xem số dư
GET /api/v1/wallet/balance

# Lịch sử giao dịch
GET /api/v1/wallet/transactions?limit=50
```

### Order Payment
```http
# Thanh toán đơn hàng
POST /api/v1/payment/order
{ orderId, amount, orderCode, restaurantId }
```

### MoMo Callback
```http
POST /api/v1/payment/momo/callback
# Auto-processed by backend
```

---

## 🔒 Security & Privacy

### Platform Fee Ẩn
- ✅ User không thấy platform fee
- ✅ Restaurant chỉ thấy số tiền nhận được
- ✅ Driver chỉ thấy số tiền commission
- ✅ Chỉ Admin thấy platform fee details

### Implementation
```typescript
// Method ẩn platform fee
private hidePlatformFee(order: any): any {
  const cleanedOrder = { ...order };
  delete cleanedOrder.platformFeeAmount;
  delete cleanedOrder.platformFeeRate;
  delete cleanedOrder.driverCommissionRate;
  return cleanedOrder;
}

// Chỉ admin thấy platform fee
async getOrderByIdWithPlatformFee(orderId: string) {
  // Trả về đầy đủ thông tin, không ẩn
}
```

---

## 📝 Code Example

### Auto Distribute Implementation

```typescript
// order.service.ts
async updateOrderStatus(orderId: string, updateData: any) {
  const updatedOrder = await this.orderModel.findByIdAndUpdate(...);
  
  // PHÂN CHIA TIỀN KHI ĐƠN DELIVERED
  if (updateData.status === 'delivered') {
    await this.distributeOrderEarnings(updatedOrder);
  }
  
  return updatedOrder;
}

private async distributeOrderEarnings(order: any) {
  // Tính toán
  const platformFeeAmount = Math.floor(order.subtotal * 0.10);
  const restaurantRevenue = order.subtotal - platformFeeAmount;
  const driverPayment = (order.deliveryFee + order.tip) - commission;
  
  // Credit vào ví
  await this.walletService.distributeOrderEarnings({
    restaurantId: order.restaurantId,
    driverId: order.driverId,
    restaurantRevenue,
    driverPayment,
    platformFeeAmount,
  });
}
```

---

## ✅ Checklist

- [x] Wallet Service - Multi-actor
- [x] MoMo Integration - Complete
- [x] Order Payment Flow - Auto
- [x] Auto Distribute Earnings - Implemented
- [x] Platform Fee Hidden - From users
- [x] Customer Wallet UI - Done
- [x] Transaction History - Display
- [ ] Restaurant Wallet UI
- [ ] Driver Wallet UI
- [ ] Testing với MoMo Sandbox
- [ ] Production Deployment

---

## 🚀 Next Steps

1. Test complete flow với MoMo sandbox
2. Implement Restaurant & Driver wallet UI
3. Add error handling cho payment failures
4. Implement refund flow (nếu cần)
5. Production deployment với MoMo production credentials

---

## 📞 Support

Nếu có vấn đề:
- Check MoMo callback logs
- Verify transaction status trong database
- Check wallet balance & transactions
- Test với MoMo sandbox trước production

