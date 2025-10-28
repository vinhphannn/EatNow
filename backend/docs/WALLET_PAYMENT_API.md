# 💰 Wallet & Payment API Documentation

## Tổng quan

Hệ thống ví và thanh toán tích hợp với MoMo, hỗ trợ:
- **Multi-actor wallets**: Customer, Restaurant, Driver, Restaurant, Admin
- **Payment providers**: MoMo, ZaloPay, Bank Transfer, Cash
- **Automatic distribution**: Tự động phân chia tiền khi đơn hàng hoàn thành

---

## 🔑 Wallet Endpoints

### 1. Lấy thông tin ví
```http
GET /api/v1/wallet/balance
Authorization: Bearer <token>

# Response:
{
  "balance": 500000,
  "pendingBalance": 100000,
  "totalDeposits": 2000000,
  "totalWithdrawals": 500000,
  "isActive": true
}
```

### 2. Nạp tiền vào ví
```http
POST /api/v1/payment/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100000,
  "provider": "momo",
  "ownerType": "customer"
}

# Response:
{
  "success": true,
  "transactionId": "transaction_id",
  "paymentUrl": "https://payment.momo.vn/...",
  "redirectUrl": "https://payment.momo.vn/..."
}
```

### 3. Rút tiền từ ví
```http
POST /api/v1/payment/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "provider": "momo",
  "phoneNumber": "0937123456"
}

# Response:
{
  "success": true,
  "transactionId": "transaction_id",
  "status": "processing",
  "message": "Yêu cầu rút tiền đã được xử lý"
}
```

### 4. Lấy lịch sử giao dịch
```http
GET /api/v1/wallet/transactions?limit=50
Authorization: Bearer <token>

# Response:
{
  "transactions": [
    {
      "_id": "transaction_id",
      "type": "deposit",
      "amount": 100000,
      "description": "Nạp tiền vào ví qua momo",
      "status": "completed",
      "provider": "momo",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

---

## 🎯 Order Payment Flow

### 1. Customer tạo đơn hàng
```http
POST /api/v1/orders
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "restaurantId": "restaurant_id",
  "items": [...],
  "deliveryAddress": {...},
  "paymentMethod": "momo"
}
```

### 2. Thanh toán đơn hàng
```http
POST /api/v1/payment/order
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "orderId": "order_id",
  "amount": 150000,
  "orderCode": "ORD001",
  "restaurantId": "restaurant_id"
}

# Response:
{
  "success": true,
  "transactionId": "transaction_id",
  "paymentUrl": "https://payment.momo.vn/...",
  "redirectUrl": "https://payment.momo.vn/..."
}
```

### 3. Customer redirect đến MoMo và thanh toán

### 4. MoMo callback xử lý
```http
POST /api/v1/payment/momo/callback

# Auto-processed by MoMo
```

### 5. Tự động phân chia khi đơn DELIVERED
```typescript
// Backend tự động gọi khi order.status = 'delivered'
await walletService.distributeOrderEarnings(order);
```

Kết quả:
- **Restaurant**: Nhận `restaurantRevenue`
- **Driver**: Nhận `driverPayment` (commission)
- **Platform**: Nhận `platformFeeAmount`

---

## 🏗️ Database Schema

### Wallet Schema
```typescript
{
  _id: ObjectId,
  userId?: ObjectId,           // Customer/Admin
  restaurantId?: ObjectId,    // Restaurant
  driverId?: ObjectId,       // Driver
  ownerType: string,          // 'customer' | 'restaurant' | 'driver' | 'admin'
  isSystemWallet?: boolean,   // Platform wallet
  balance: number,             // Số dư khả dụng
  pendingBalance: number,      // Số dư đang chờ
  totalDeposits: number,       // Tổng đã nạp
  totalWithdrawals: number,    // Tổng đã rút
  isActive: boolean
}
```

### WalletTransaction Schema
```typescript
{
  _id: ObjectId,
  walletId: ObjectId,
  userId?: ObjectId,
  restaurantId?: ObjectId,
  driverId?: ObjectId,
  type: string,                // 'deposit' | 'withdraw' | 'order_payment' | 'order_revenue' | 'commission' | 'platform_fee' | 'refund'
  amount: number,
  description: string,
  status: string,               // 'pending' | 'completed' | 'failed' | 'cancelled'
  provider?: string,           // 'momo' | 'zalopay' | 'cash'
  providerTransactionId?: string,
  providerPaymentUrl?: string,
  providerCallback?: any,
  orderId?: ObjectId,
  orderCode?: string,
  metadata?: any
}
```

---

## 🔄 Luồng xử lý

### Luồng nạp tiền
```
User muốn nạp tiền
    ↓
POST /payment/deposit
    ↓
Tạo WalletTransaction (status: pending)
    ↓
Gọi MoMo API → nhận paymentUrl
    ↓
Trả về paymentUrl cho Frontend
    ↓
User redirect → MoMo thanh toán
    ↓
MoMo callback → POST /payment/momo/callback
    ↓
Verify signature + Update transaction (status: completed)
    ↓
Credit vào ví nội bộ (balance += amount)
```

### Luồng thanh toán đơn hàng
```
Customer đặt đơn
    ↓
POST /orders → Tạo Order (status: pending)
    ↓
POST /payment/order → Tạo PaymentTransaction
    ↓
Gọi MoMo API → nhận paymentUrl
    ↓
Customer thanh toán trên MoMo
    ↓
MoMo callback → Update Payment (success)
    ↓
Update Order (status: confirmed)
    ↓
Restaurant xác nhận → preparing → ready
Driver nhận đơn → picking_up → picked_up
Driver giao → delivered
    ↓
Auto distribute earnings:
  - Restaurant: credit restaurantRevenue
  - Driver: credit driverPayment
  - Platform: credit platformFeeAmount
```

---

## 📊 Transaction Types

| Type | Description | Amount | Balance Change |
|------|-------------|--------|----------------|
| `deposit` | Nạp tiền | +100000 | balance += 100000 |
| `withdraw` | Rút tiền | -50000 | balance -= 50000 |
| `order_payment` | Khách trả tiền | -150000 | balance -= 150000 |
| `order_revenue` | Nhà hàng nhận | +140000 | balance += 140000 |
| `commission` | Tài xế nhận | +20000 | balance += 20000 |
| `platform_fee` | Platform thu | +5000 | balance += 5000 |
| `refund` | Hoàn tiền | +150000 | balance += 150000 |

---

## 🔧 Environment Variables

```env
# MoMo Configuration
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_REDIRECT_URL=http://localhost:3002/customer/wallet/success
MOMO_IPN_URL=http://localhost:3001/api/v1/payment/momo/callback
MOMO_ENV=test  # 'test' hoặc 'production'
```

---

## 🚀 Cách sử dụng

### 1. Nạp tiền (Customer)
```typescript
const response = await fetch('/api/v1/payment/deposit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 100000,
    provider: 'momo',
    ownerType: 'customer'
  })
});

const { paymentUrl } = await response.json();
window.location.href = paymentUrl; // Redirect to MoMo
```

### 2. Thanh toán đơn hàng
```typescript
const response = await fetch('/api/v1/payment/order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderId: order._id,
    amount: order.finalTotal,
    orderCode: order.code,
    restaurantId: order.restaurantId
  })
});

const { paymentUrl } = await response.json();
window.location.href = paymentUrl;
```

### 3. Rút tiền (Restaurant/Driver)
```typescript
await fetch('/api/v1/payment/withdraw', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 200000,
    provider: 'momo',
    phoneNumber: '0937123456'
  })
});
```

---

## 🎯 Tích hợp với Order Module

### Tự động thanh toán khi đặt đơn
```typescript
// order.service.ts
async createOrder(createOrderDto: CreateOrderDto, customerId: string) {
  // 1. Tạo order
  const order = await this.orderModel.create({...});
  
  // 2. Nếu paymentMethod = 'momo', tạo payment transaction
  if (order.paymentMethod === 'momo') {
    await this.paymentService.createOrderPayment(order);
  }
  
  return order;
}
```

### Tự động phân chia khi đơn DELIVERED
```typescript
// order.service.ts
async updateOrderStatus(orderId: string, status: string) {
  const order = await this.orderModel.findByIdAndUpdate(orderId, { status });
  
  // Nếu đơn DELIVERED → phân chia tiền
  if (status === 'delivered') {
    await this.walletService.distributeOrderEarnings(order);
  }
  
  return order;
}
```

---

## ✅ Checklist Implementation

- [x] Wallet Schema - hỗ trợ multi-actor
- [x] WalletTransaction Schema - tracking đầy đủ
- [x] MomoService - tích hợp MoMo API
- [x] WalletService - methods cho nạp/rút/balance
- [x] PaymentController - endpoints cho payment
- [x] DTOs - validate input/output
- [ ] Tích hợp với Order module
- [ ] Frontend payment flow
- [ ] Testing với MoMo sandbox
- [ ] Environment variables setup

---

## 📝 Notes

1. **Multi-actor support**: Mỗi actor có ví riêng, không bị lẫn nhau
2. **Transaction tracking**: Mọi giao dịch đều được log và track
3. **Auto distribution**: Tự động phân chia khi đơn delivered
4. **Platform fee**: Platform thu phí từ mỗi đơn hàng
5. **Refund support**: Hỗ trợ hoàn tiền nếu cần

