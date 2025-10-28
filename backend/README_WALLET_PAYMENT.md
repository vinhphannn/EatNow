# 💳 Wallet & Payment System - README

## 🎯 Mục đích

Hệ thống ví và thanh toán tích hợp MoMo, hỗ trợ:
- Customer/Restaurant/Driver có ví riêng
- Nạp/rút tiền qua MoMo
- Thanh toán đơn hàng qua MoMo
- Tự động phân chia tiền khi đơn delivered
- Platform fee ẩn khỏi user/restaurant

---

## 📁 File Structure

```
backend/
├── src/
│   ├── payment/
│   │   ├── momo.service.ts          # MoMo integration
│   │   ├── payment.controller.ts    # Payment endpoints
│   │   ├── payment.module.ts        # Payment module
│   │   └── schemas/
│   │       └── payment.schema.ts     # Payment schema
│   │
│   ├── wallet/
│   │   ├── wallet.service.ts        # Wallet operations
│   │   ├── wallet.controller.ts     # Wallet endpoints
│   │   ├── schemas/
│   │   │   ├── wallet.schema.ts     # Wallet schema
│   │   │   └── wallet-transaction.schema.ts  # Transaction schema
│   │
│   ├── order/
│   │   ├── order.service.ts          # ⭐ Integrated với wallet
│   │   └── order.module.ts          # Imports WalletModule
│   │
│   └── app.module.ts                 # Main module
│
└── docs/
    ├── WALLET_PAYMENT_API.md        # API reference
    ├── PAYMENT_INTEGRATION.md       # Integration guide
    ├── WALLET_PAYMENT_COMPLETE.md   # Complete guide
    └── TESTING_GUIDE.md             # Testing instructions
```

---

## 🔄 Complete Flow

### 1. Customer Nạp Tiền
```
Customer click "Nạp tiền" 
  → POST /payment/deposit
  → Create transaction (pending)
  → Get MoMo payment URL
  → Redirect to MoMo
  → Customer pays
  → MoMo callback
  → Update transaction (completed)
  → Credit wallet
```

### 2. Order Payment
```
Customer orders
  → POST /orders/from-cart
  → Create order (pending)
  → POST /payment/order
  → Get MoMo payment URL
  → Customer pays
  → MoMo callback
  → Order confirmed
  → Restaurant notified
```

### 3. Auto Distribute
```
Order delivered
  → Auto trigger: distributeOrderEarnings()
  → Calculate: restaurantRevenue, driverPayment, platformFee
  → Credit vào ví tương ứng
  → Log transactions
```

---

## 📊 Money Distribution

```
📦 Order: 180,000 VND
│
├─ 🏪 Restaurant: 135,000 VND  (150,000 - 15,000 platform fee)
├─ 🚗 Driver: 26,000 VND       (20,000 + 10,000 - 4,000 commission)
└─ 💼 Platform: 19,000 VND     (15,000 + 4,000 - HIDDEN)
```

---

## 🔒 Platform Fee Privacy

### Hidden Fields (từ user/restaurant):
- `platformFeeAmount`
- `platformFeeRate`
- `driverCommissionRate`

### Visible Fields (cho user/restaurant):
- `restaurantRevenue` (Restaurant thấy)
- `driverPayment` (Driver thấy)
- `finalTotal` (Customer thấy)

### Admin Only:
- Full order details including platform fee
- Use `getOrderByIdWithPlatformFee()` method

---

## 🧪 Testing

### Quick Test:
```bash
# 1. Start services
mongod
redis-server
npm run start:dev  # Backend
npm run dev        # Frontend

# 2. Test deposit
POST /api/v1/payment/deposit
{ amount: 100000, provider: "momo" }

# 3. Test order payment
POST /api/v1/payment/order
{ orderId, amount, orderCode, restaurantId }

# 4. Check distributions after delivered
GET /api/v1/wallet/transactions
```

Xem chi tiết tại: `docs/TESTING_GUIDE.md`

---

## 📚 Documentation

- **API Reference**: `docs/WALLET_PAYMENT_API.md`
- **Integration Guide**: `docs/PAYMENT_INTEGRATION.md`
- **Complete Flow**: `docs/WALLET_PAYMENT_COMPLETE.md`
- **Testing Guide**: `docs/TESTING_GUIDE.md`

---

## ⚙️ Configuration

### Environment Variables
```env
# MoMo
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_REDIRECT_URL=http://localhost:3002/wallet/success
MOMO_IPN_URL=http://localhost:3001/api/v1/payment/momo/callback
MOMO_ENV=test  # or 'production'
```

### Rate Configuration (in OrderSchema)
```typescript
platformFeeRate: 10       // 10% from restaurant
driverCommissionRate: 30  // 30% from delivery fee
```

---

## 🚀 Production Checklist

- [ ] Setup MoMo production credentials
- [ ] Configure SSL for callback URL
- [ ] Add IP whitelist in MoMo dashboard
- [ ] Test complete flow in sandbox
- [ ] Setup monitoring & alerts
- [ ] Configure error logging
- [ ] Backup database regularly
- [ ] Document API endpoints
- [ ] Setup rate limiting
- [ ] Test refund flow (if needed)

---

## 🆘 Troubleshooting

### Callback not received
- Check IP whitelist in MoMo dashboard
- Verify SSL certificate
- Check logs: `POST /payment/momo/callback`

### Payment not confirmed
- Verify signature in callback
- Check transaction status
- Review wallet balance

### Earnings not distributed
- Check order status = "delivered"
- Review logs for distributeOrderEarnings
- Verify wallet service works

### Platform fee visible
- Check hidePlatformFee() method
- Verify order response
- Review getOrderById() implementation

---

## 📝 Notes

- Platform fee calculation: `subtotal * platformFeeRate / 100`
- Driver commission: `(deliveryFee + doorFee) * driverCommissionRate / 100`
- Platform fee is stored but hidden from users
- Only Admin can see platform fee details
- All transactions are logged for audit
- Refund flow not implemented (if needed, use manual refund)

---

## ✅ Status

**Completed:**
- ✅ Wallet Service - Multi-actor
- ✅ MoMo Integration
- ✅ Payment Flow
- ✅ Auto Distribute Earnings
- ✅ Platform Fee Privacy
- ✅ Customer Wallet UI
- ✅ Transaction History

**Remaining:**
- ⏳ Test with MoMo sandbox
- ⏳ Production deployment
- ⏳ Refund flow (optional)

---

**Last Updated:** 2024
**Version:** 1.0.0

