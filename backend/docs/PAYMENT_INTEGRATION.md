# 💳 Payment Integration Guide

## Tổng quan

Hệ thống tích hợp thanh toán MoMo với các tính năng:
- ✅ Nạp tiền vào ví (deposit)
- ✅ Rút tiền từ ví (withdraw)
- ✅ Thanh toán đơn hàng (order payment)
- ✅ Tự động phân chia tiền khi đơn hoàn thành

---

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  Customer Wallet UI  │  Order Payment UI  │  Restaurant   │
│                      │                    │  Dashboard    │
└──────────────────────┼────────────────────┼─────────────┘
                       │                    │
                       ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                       │
├─────────────────────────────────────────────────────────┤
│  PaymentController  │  WalletService  │  OrderService    │
│                      │                 │                  │
│  - deposit()         │  - depositVia   │  - createOrder() │
│  - withdraw()        │  - withdrawFrom │  - distribute()  │
│  - payOrder()        │  - getWallet()  │                  │
│  - callback()         │                 │                  │
└──────────────────────┼─────────────────┼─────────────────┘
                       │                 │
                       ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│              Database (MongoDB + Redis)                  │
├─────────────────────────────────────────────────────────┤
│  Wallets             │  Transactions   │  Orders          │
│  - balance           │  - type         │  - status        │
│  - pendingBalance    │  - amount       │  - paymentInfo   │
│  - totalDeposits     │  - status       │  - earnings      │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   External Services                       │
├─────────────────────────────────────────────────────────┤
│  MoMo Payment Gateway   │   ZaloPay (future)             │
│  - createPaymentUrl()   │   - Transfer API              │
│  - verifyCallback()     │                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Payment Flow

### Phase 1: Customer muốn nạp tiền

```typescript
// 1. Frontend: User click nạp tiền
POST /api/v1/payment/deposit
{
  amount: 100000,
  provider: 'momo',
  ownerType: 'customer'
}

// 2. Backend: Tạo transaction + MoMo URL
const transaction = await walletService.depositViaProvider(...);
const paymentUrl = await momoService.createPaymentUrl(...);

// 3. Response
{
  transactionId: "txn_123",
  paymentUrl: "https://payment.momo.vn/..."
}

// 4. Frontend: Redirect user
window.location.href = paymentUrl;
```

### Phase 2: MoMo xử lý thanh toán

```
Customer → MoMo App/Web
    ↓
Chọn: Thanh toán
    ↓
Nhập PIN
    ↓
✅ Thanh toán thành công
    ↓
MoMo gọi callback: POST /api/v1/payment/momo/callback
```

### Phase 3: Backend xử lý callback

```typescript
POST /api/v1/payment/momo/callback
{
  orderId: "txn_123",
  resultCode: 0,
  amount: 100000,
  signature: "..."
}

// Verify signature
if (!momoService.verifyCallback(data)) return error;

// Update transaction
await walletService.confirmDeposit(
  transactionId,
  momoTransactionId,
  callbackData
);

// Response
{ success: true }
```

### Phase 4: Ví được credit

```typescript
// Wallet.balance += amount
// Wallet.totalDeposits += amount
// Transaction.status = 'completed'
```

---

## 🛒 Order Payment Flow

### 1. Customer đặt đơn

```typescript
POST /api/v1/orders
{
  restaurantId: "...",
  items: [...],
  deliveryAddress: {...},
  paymentMethod: "momo",
  finalTotal: 150000
}

// Order created with status: 'pending'
```

### 2. Tạo payment transaction

```typescript
POST /api/v1/payment/order
{
  orderId: "order_123",
  amount: 150000,
  orderCode: "ORD001",
  restaurantId: "rest_456"
}

// Create transaction (pending)
// Get MoMo payment URL
// Return paymentUrl
```

### 3. Customer thanh toán trên MoMo

```typescript
// Redirect to MoMo
// Customer pays 150,000 VND
```

### 4. MoMo callback

```typescript
POST /api/v1/payment/momo/callback
{
  orderId: "txn_order_123",
  resultCode: 0,
  amount: 150000
}

// Verify & confirm deposit
await walletService.confirmDeposit(...);

// Update order
order.status = 'confirmed';
await order.save();

// Notify restaurant
socket.emit('new_order', order);
```

### 5. Order processing

```
Restaurant xác nhận → preparing → ready
Driver nhận đơn → picking_up → picked_up
Driver giao → delivered
```

### 6. Auto distribute earnings

```typescript
// Order completed → Auto distribute
await walletService.distributeOrderEarnings(order);

// Restaurant wallet:
// balance += restaurantRevenue (140,000 VND)

// Driver wallet:
// balance += driverPayment (15,000 VND - deliveryFee + tip)

// Platform wallet:
// balance += platformFeeAmount (5,000 VND)
```

---

## 💰 Money Distribution Logic

### Khi đơn được đặt (Order created)

```
Customer Wallet:
  balance -= finalTotal (150,000 VND)
  Transaction: { type: 'order_payment', amount: -150000 }

Order:
  paidAmount: 150,000 VND
  paymentStatus: 'paid'
```

### Khi đơn completed (Order delivered)

```
Order: {
  subtotal: 130,000 VND
  deliveryFee: 20,000 VND
  tip: 10,000 VND
  platformFee: 5,000 VND
  finalTotal: 150,000 VND
  
  restaurantRevenue: 125,000 VND  // subtotal - platformFee
  driverPayment: 15,000 VND          // deliveryFee + tip - commission
  platformFeeAmount: 5,000 VND      // Platform fee
}

// Distribute:
Restaurant.balance += 125,000
Driver.balance += 15,000
Platform.balance += 5,000
```

---

## 🔧 Implementation Checklist

### Backend ✅

- [x] Wallet Schema - multi-actor support
- [x] WalletTransaction Schema - full tracking
- [x] MomoService - MoMo integration
- [x] WalletService - all methods
- [x] PaymentController - all endpoints
- [x] DTOs - validation
- [x] PaymentModule - module setup
- [ ] Tích hợp với OrderService
- [ ] Socket.io notifications

### Frontend (TODO)

- [ ] Wallet page cho Customer
- [ ] Deposit UI với MoMo
- [ ] Withdraw UI
- [ ] Transaction history
- [ ] Order payment flow
- [ ] Wallet dashboard cho Restaurant/Driver

### Testing (TODO)

- [ ] Test nạp tiền flow
- [ ] Test rút tiền flow
- [ ] Test thanh toán đơn
- [ ] Test MoMo callback
- [ ] Test phân chia tiền
- [ ] Test với MoMo sandbox

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env với MoMo credentials
```

### 2. Run Backend

```bash
npm run start:dev
```

### 3. Test API

```bash
# Test deposit
curl -X POST http://localhost:3001/api/v1/payment/deposit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100000,
    "provider": "momo",
    "ownerType": "customer"
  }'
```

### 4. Test MoMo Callback (Manual)

```bash
curl -X POST http://localhost:3001/api/v1/payment/momo/callback \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order",
    "resultCode": 0,
    "amount": 100000,
    "signature": "..."
  }'
```

---

## 📊 Database Collections

### wallets collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId?,           // Customer
  restaurantId: ObjectId?,     // Restaurant
  driverId: ObjectId?,         // Driver
  ownerType: "customer",      // owner type
  isSystemWallet: false,      // Platform wallet
  balance: 500000,            // Available
  pendingBalance: 100000,      // Pending
  totalDeposits: 2000000,     // Total nạp
  totalWithdrawals: 500000,    // Total rút
  isActive: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### wallet_transactions collection

```javascript
{
  _id: ObjectId,
  walletId: ObjectId,
  userId: ObjectId?,
  restaurantId: ObjectId?,
  driverId: ObjectId?,
  type: "deposit",            // deposit | withdraw | order_payment | order_revenue | commission | platform_fee | refund
  amount: 100000,
  description: "Nạp tiền vào ví qua momo",
  status: "completed",        // pending | completed | failed | cancelled
  provider: "momo",           // momo | zalopay | cash | bank_transfer
  providerTransactionId: "momo_txn_123",
  providerPaymentUrl: "https://...",
  providerCallback: {...},    // Raw MoMo callback
  orderId: ObjectId?,
  orderCode: "ORD001",
  metadata: {...},
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## 🎯 Next Steps

1. **Complete Order Integration**
   - Tích hợp walletService vào orderService
   - Auto-create payment khi đặt đơn với MoMo
   - Auto-distribute khi đơn delivered

2. **Frontend Integration**
   - Wallet UI cho Customer
   - Deposit/Withdraw UI
   - Order payment flow
   - Transaction history

3. **Testing**
   - Test với MoMo sandbox
   - Test complete flow
   - Performance testing

4. **Production Setup**
   - MoMo production credentials
   - IP whitelisting
   - SSL certificate
   - Monitoring & logging

---

## 📝 Notes

- **MoMo sandbox**: Test environment cho development
- **Production**: Cần credentials thật từ MoMo
- **Security**: Always verify signature trong callback
- **Logging**: Log mọi transaction để audit
- **Idempotency**: Handle duplicate callbacks
- **Refund**: Implement refund nếu cần

