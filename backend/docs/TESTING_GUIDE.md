# 🧪 Testing Guide - Wallet & Payment System

## Prerequisites

### 1. Setup Environment

```bash
# Backend
cd backend
cp .env.example .env

# Edit .env với MoMo credentials
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_REDIRECT_URL=http://localhost:3002/customer/wallet/success
MOMO_IPN_URL=http://localhost:3001/api/v1/payment/momo/callback
MOMO_ENV=test
```

### 2. Start Services

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Redis
redis-server

# Terminal 3: Start Backend
cd backend
npm run start:dev

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

---

## 🧪 Test Cases

### Test 1: Customer Nạp Tiền

#### Steps:
1. Login as Customer
2. Navigate to `/customer/wallet`
3. Click "Nạp tiền"
4. Enter amount: `100`
5. Click "Xác nhận"
6. Redirect to MoMo sandbox
7. Complete payment
8. MoMo callback → Check database

#### Expected Result:
```json
{
  "balance": 100000,
  "pendingBalance": 0,
  "transactions": [
    {
      "type": "deposit",
      "amount": 100000,
      "status": "completed"
    }
  ]
}
```

---

### Test 2: Customer Đặt Đơn Hàng

#### Steps:
1. Add items to cart
2. Go to checkout
3. Select payment method: "MoMo"
4. Place order
5. Complete payment on MoMo
6. Verify order created with status: "confirmed"

#### Expected:
- Order created successfully
- Payment transaction created
- Order status: confirmed
- Restaurant notified

---

### Test 3: Restaurant Chuẩn Bị & Driver Giao Hàng

#### Steps:
1. Restaurant login → See new order
2. Restaurant confirm → status: "confirmed"
3. Restaurant prepare → status: "preparing"
4. Restaurant mark ready → status: "ready"
5. Driver auto-assigned (or manual assign)
6. Driver pick up → status: "picked_up"
7. Driver deliver → status: "delivered"

#### Auto Distribute:
Khi order status = "delivered", check database:

```javascript
// Restaurant wallet
{
  "balance": 135000,  // restaurantRevenue
  "transactions": [
    {
      "type": "order_revenue",
      "amount": 135000,
      "status": "completed"
    }
  ]
}

// Driver wallet
{
  "balance": 26000,  // driverPayment
  "transactions": [
    {
      "type": "commission",
      "amount": 26000,
      "status": "completed"
    }
  ]
}

// Platform wallet (system wallet)
{
  "balance": 19000,  // platformFeeAmount
  "transactions": [
    {
      "type": "platform_fee",
      "amount": 19000,
      "status": "completed"
    }
  ]
}
```

---

### Test 4: Rút Tiền

#### Restaurant:
```bash
POST /api/v1/payment/withdraw
{
  "amount": 50000,
  "provider": "momo",
  "phoneNumber": "0937123456"
}
```

#### Expected:
```json
{
  "success": true,
  "transactionId": "txn_123",
  "status": "processing"
}
```

Database:
- Wallet balance: -= 50000
- Transaction created with status: "pending"

---

## 🔍 Verify Results

### Check Wallet Balance
```bash
# Customer
GET /api/v1/wallet/balance

# Restaurant
GET /api/v1/restaurants/mine/wallet/balance

# Driver
GET /api/v1/driver/wallet/balance
```

### Check Transactions
```bash
# Customer
GET /api/v1/wallet/transactions?limit=50

# Restaurant
GET /api/v1/restaurants/mine/wallet/transactions?limit=50

# Driver
GET /api/v1/driver/wallet/transactions?limit=50
```

### Check Order Earnings
```bash
GET /api/v1/orders/:orderId
```

Verify:
- ✅ `restaurantRevenue` (visible)
- ✅ `driverPayment` (visible)
- ❌ `platformFeeAmount` (hidden)
- ❌ `platformFeeRate` (hidden)

### Check Auto Distribution
When order status = "delivered":
```bash
# In logs
💰 Distributing earnings for order xxx:
   - Restaurant revenue: 135,000 VND
   - Driver payment: 26,000 VND
   - Platform fee: 19,000 VND (hidden from users)

✅ Earnings distributed for order xxx
```

---

## 🐛 Debug Tips

### 1. MoMo Callback Not Working
- Check `MOMO_IPN_URL` in `.env`
- Verify server is publicly accessible (ngrok for local dev)
- Check MoMo dashboard for callback logs

### 2. Payment Not Confirming
- Check transaction status in database
- Verify MoMo callback signature
- Check logs: `POST /payment/momo/callback`

### 3. Earnings Not Distributed
- Check if order status = "delivered"
- Check wallet service logs
- Verify distribution results in database

### 4. Platform Fee Visible
- Check `hidePlatformFee()` method
- Verify only admin sees platform fee
- Check order response

---

## 📊 Test Data

### Sample Order
```json
{
  "customerId": "customer_user_id",
  "restaurantId": "restaurant_id",
  "subtotal": 150000,
  "deliveryFee": 20000,
  "tip": 10000,
  "finalTotal": 180000,
  "paymentMethod": "momo"
}
```

### Expected Distribution
```
Order Total: 180,000 VND

┌─────────────────────────────────┐
│ Restaurant: 135,000 VND         │ ← 150,000 - 15,000 (10% fee)
├─────────────────────────────────┤
│ Driver: 26,000 VND              │ ← (20,000 + 10,000) - 4,000 (30% commission)
├─────────────────────────────────┤
│ Platform: 19,000 VND            │ ← 15,000 + 4,000 (hidden)
└─────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Customer can deposit to wallet
- [ ] Customer can withdraw from wallet
- [ ] Customer can pay order with MoMo
- [ ] MoMo callback works correctly
- [ ] Order created successfully
- [ ] Restaurant receives order notification
- [ ] Restaurant sees order revenue (not platform fee)
- [ ] Driver receives commission
- [ ] Platform fee hidden from users
- [ ] Auto distribute works when delivered
- [ ] All transactions logged correctly
- [ ] Wallet balance updated correctly

---

## 🚀 Production Deployment

Before production:
1. Update MoMo credentials (production)
2. Setup SSL certificate
3. Configure CORS properly
4. Add IP whitelist in MoMo dashboard
5. Test complete flow in staging
6. Monitor logs & errors
7. Setup alerts for payment failures

