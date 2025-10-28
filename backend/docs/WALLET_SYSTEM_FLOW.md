# 💰 EatNow Wallet System - Chi tiết luồng hoạt động

## 📊 Tổng quan

Hệ thống ví EatNow là **multi-actor wallet** hỗ trợ 4 loại actor:
- **Customer**: Khách hàng mua đồ ăn
- **Restaurant**: Nhà hàng bán đồ ăn
- **Driver**: Tài xế giao hàng
- **Admin/Platform**: Hệ thống thu phí

## 🔑 Cấu trúc Wallet

### Balance Fields (3 loại số dư)

```typescript
{
  balance: 100000,      // ✅ Số dư KHẢ DỤNG (có thể rút/thanh toán ngay)
  pendingBalance: 50000, // ⏳ Số dư CHỜ (đang chờ MoMo callback)
  escrowBalance: 200000 // 🔒 Số dư GIỮ (đã thanh toán đơn nhưng chưa delivered)
}
```

**Quan hệ:**
```
Total Available = balance + pendingBalance
Total Locked = escrowBalance
Real Money = balance + pendingBalance + escrowBalance
```

## 📥 INPUT: Luồng nạp tiền (Customer Nạp Tiền)

### Step 1: Customer Click "Nạp Tiền"
```
Frontend: walletService.deposit(amount, 'momo')
↓
POST /api/v1/payment/deposit
Body: { amount: 100000, provider: 'momo' }
```

### Step 2: Backend Tạo Transaction PENDING
```typescript
// payment.controller.ts
await walletService.depositViaProvider(
  'customer',
  userId,
  100000,
  'momo'
);
```

**Trong `wallet.service.ts`:**
```typescript
1. ✅ VALIDATION: Check amount (10k ≤ amount ≤ 10M)
2. ✅ ATOMIC: Start MongoDB session
3. Tạo transaction record:
   - walletId: customer_wallet._id
   - type: 'deposit'
   - amount: 100000
   - status: 'pending'
   - provider: 'momo'
4. ✅ ATOMIC: Update wallet
   balance: 0 → 0 (không đổi)
   pendingBalance: 0 → 100000 (tăng)
```

**Kết quả Wallet:**
```json
{
  "balance": 0,
  "pendingBalance": 100000, // ← Đang chờ
  "escrowBalance": 0
}
```

### Step 3: Tạo MoMo Payment URL
```typescript
const paymentUrl = await momoService.createPaymentUrl({
  orderId: transaction._id,
  amount: 100000,
  orderInfo: "Nạp tiền vào ví 100000 VND"
});
// → Redirect user đến MoMo để thanh toán
```

### Step 4: MoMo Callback (User đã thanh toán)
```
MoMo gọi: POST /api/v1/payment/momo/callback
Body: {
  orderId: transaction._id,
  resultCode: 0, // Success
  signature: "xxx..."
}
```

**Backend xử lý:**
```typescript
// payment.controller.ts
await walletService.confirmDeposit(transactionId, providerTransactionId);

// wallet.service.ts
1. ✅ ATOMIC: Start session
2. ✅ DEDUPLICATION: Check duplicate providerTransactionId
3. Update transaction: status = 'completed'
4. ✅ ATOMIC: Move pendingBalance → balance
   pendingBalance: 100000 → 0
   balance: 0 → 100000
   totalDeposits: 0 → 100000
```

**Kết quả Wallet:**
```json
{
  "balance": 100000, // ✅ Available
  "pendingBalance": 0,
  "escrowBalance": 0
}
```

---

## 💸 OUTPUT: Luồng thanh toán đơn hàng

### Scenario A: Thanh Toán Bằng Ví (Wallet Payment)

#### Step 1: Customer Chọn "Thanh Toán Bằng Ví"
```
Frontend: walletService.payOrder(orderId, amount, orderCode)
↓
POST /api/v1/payment/order
Body: { 
  orderId: "xxx", 
  amount: 180000, 
  orderCode: "12345",
  method: 'wallet'
}
```

#### Step 2: Escrow Hold (Giữ Tiền)
```typescript
// payment.controller.ts
const tx = await walletService.payOrderFromWallet(
  'customer',
  userId,
  180000,
  orderId,
  '12345'
);
```

**Trong `wallet.service.ts` - ESCROW LOGIC:**
```typescript
1. ✅ ATOMIC: Start session
2. ✅ VALIDATION: Check balance ≥ amount
3. ✅ DEDUPLICATION: Check orderId chưa thanh toán
4. Tạo transaction:
   - type: 'order_payment'
   - amount: -180000 (âm vì trả tiền)
   - status: 'escrowed' // ⚠️ KHÔNG PHẢI 'completed'
5. ✅ ATOMIC: Update wallet
   balance: 100000 → -80000 (không đủ! → thực tế: throw error)
   
   // Nếu đủ tiền:
   balance: 500000 → 320000
   escrowBalance: 0 → 180000 // 🔒 GIỮ TIỀN
```

**Kết quả Wallet Customer:**
```json
{
  "balance": 320000,    // Available
  "pendingBalance": 0,
  "escrowBalance": 180000 // 🔒 Locked for order
}
```

**Transaction record:**
```json
{
  "type": "order_payment",
  "amount": -180000,
  "status": "escrowed", // ⚠️ Đang giữ, chưa tiêu
  "orderId": "xxx"
}
```

#### Step 3: Order Status Updates

##### 3a. Order = "pending" → "confirmed" → "preparing"
**Tiền vẫn GIỮ trong escrow**, không ai nhận được

##### 3b. Order = "ready" → "picked_up"
**Tiền vẫn GIỮ trong escrow**, driver đang giao

##### 3c. Order = "delivered" ✅
```typescript
// order.service.ts
if (updateData.status === 'delivered') {
  // 1. Release escrow
  await walletService.releaseEscrowForOrder(
    'customer',
    customerId,
    orderId,
    amount
  );
  
  // 2. Distribute earnings
  await walletService.distributeOrderEarnings(order);
}
```

**Release Escrow:**
```typescript
1. Find transaction: status = 'escrowed', orderId = xxx
2. Update: status = 'escrowed' → 'completed'
3. Update wallet:
   escrowBalance: 180000 → 0 // 🔓 MỞ KHÓA
```

**Kết quả Wallet Customer:**
```json
{
  "balance": 320000,    // Không đổi
  "pendingBalance": 0,
  "escrowBalance": 0 // ✅ ĐÃ GIẢI PHÓNG
}
```

**Transaction record:**
```json
{
  "type": "order_payment",
  "amount": -180000,
  "status": "completed", // ✅ HOÀN THÀNH
  "orderId": "xxx"
}
```

#### Step 4: Distribute Earnings (Phân chia tiền cho Restaurant, Driver, Platform)

**Restaurant nhận tiền:**
```typescript
// restaurantRevenue = subtotal - platformFee
// Ví dụ: 150000 - 15000 = 135000 VND
await walletService.distributeOrderEarnings({
  restaurantRevenue: 135000,
  driverPayment: 26000,
  platformFeeAmount: 19000
});

// Restaurant wallet updated:
balance: 0 → 135000 // ✅ NHẬN TIỀN
```

**Driver nhận tiền:**
```typescript
// Driver wallet updated:
balance: 0 → 26000 // ✅ NHẬN HOÀN HỒNG
```

**Platform thu phí (hidden):**
```typescript
// System wallet:
balance: 0 → 19000 // 💼 PLATFORM FEE
```

**Kết quả cuối cùng:**

**Customer:**
```json
{
  "balance": 320000,
  "escrowBalance": 0,
  "totalWithdrawals": 180000 // Đã thanh toán
}
```

**Restaurant:**
```json
{
  "balance": 135000,
  "totalDeposits": 135000
}
```

**Driver:**
```json
{
  "balance": 26000,
  "totalDeposits": 26000
}
```

**Platform:**
```json
{
  "balance": 19000,
  "totalDeposits": 19000
}
```

---

### Scenario B: Thanh Toán Bằng MoMo

#### Step 1: Customer Chọn "Thanh Toán MoMo"
```
POST /api/v1/payment/order
Body: { method: 'momo' }
```

#### Step 2: Tạo MoMo Payment URL
```typescript
// Tương tự nạp tiền
const transaction = await walletService.depositViaProvider(
  'customer',
  userId,
  180000,
  'momo',
  orderId
);

// Tạo MoMo URL
const paymentUrl = await momoService.createPaymentUrl({...});
```

**Wallet:**
```json
{
  "balance": 100000,
  "pendingBalance": 180000, // ⏳ Đang chờ
  "escrowBalance": 0
}
```

#### Step 3: Customer Thanh Toán MoMo
→ Redirect đến MoMo → Thanh toán → Redirect back

#### Step 4: MoMo Callback
```typescript
POST /api/v1/payment/momo/callback
→ confirmDeposit()
→ pendingBalance: 180000 → 0
→ balance: 100000 → 280000
```

**Wallet sau callback:**
```json
{
  "balance": 280000,
  "pendingBalance": 0,
  "escrowBalance": 0
}
```

#### Step 5: Order Delivered → Phân chia
→ Giống Scenario A

---

## 🚫 Luồng hủy đơn (Refund)

### Case: Customer hủy đơn đã thanh toán

```typescript
// order.service.ts
if (updateData.status === 'cancelled' && order is paid) {
  // Refund escrow
  await walletService.refundEscrowForOrder(
    'customer',
    customerId,
    orderId
  );
}
```

**Refund Escrow:**
```typescript
1. Find transaction: status = 'escrowed', orderId = xxx
2. Update: status = 'escrowed' → 'cancelled'
3. Update wallet:
   escrowBalance: 180000 → 0 // 🔓 MỞ KHÓA
   balance: 320000 → 500000 // 💰 HOÀN TIỀN
```

**Kết quả:**
```json
{
  "balance": 500000, // ✅ ĐÃ HOÀN TIỀN
  "escrowBalance": 0,
  "totalWithdrawals": 0 // Không mất tiền
}
```

---

## 💰 Luồng rút tiền (Withdraw)

### Step 1: Customer Click "Rút Tiền"
```
POST /api/v1/payment/withdraw
Body: { amount: 50000, provider: 'momo', phoneNumber: '0937123456' }
```

### Step 2: Atomic Withdraw
```typescript
await walletService.withdrawFromWallet(
  'customer',
  userId,
  50000,
  'momo',
  '0937123456'
);
```

**Wallet:**
```json
{
  "balance": 100000 → 50000, // Trừ ngay
  "totalWithdrawals": 0 → 50000
}
```

**Transaction:**
```json
{
  "type": "withdraw",
  "amount": -50000,
  "status": "pending",
  "provider": "momo"
}
```

**Note:** MoMo có thể chưa support withdraw API → cần manual process.

---

## 📊 Diagram: Money Flow

```
Customer Nạp 100k
  ↓
balance: 0 → 100k ✅

Customer Đặt Đơn 80k (Wallet)
  ↓
balance: 100k → 20k (trừ 80k)
escrowBalance: 0 → 80k 🔒 (giữ 80k)

Order Delivered
  ↓
escrowBalance: 80k → 0 🔓 (mở khóa)
  ↓ PHÂN CHIA:
Restaurant: 0 → 60k ✅
Driver: 0 → 15k ✅
Platform: 0 → 5k 💼

Customer:
  balance: 20k (available)
  escrowBalance: 0 (không giữ nữa)
  totalWithdrawals: 80k (đã thanh toán)
```

---

## 🎯 Tóm tắt các luồng

### 1. **Nạp Tiền** (Deposit)
- Input: `amount`, `provider`
- Process: Tạo transaction pending → MoMo callback → move pendingBalance → balance
- Output: Balance tăng

### 2. **Thanh Toán Wallet** (Pay Order from Wallet)
- Input: `orderId`, `amount`, `method='wallet'`
- Process: Trừ balance, tăng escrowBalance, status='escrowed'
- Output: Tiền GIỮ, chưa phân chia

### 3. **Thanh Toán MoMo** (Pay Order via MoMo)
- Input: `orderId`, `amount`, `method='momo'`
- Process: Tạo MoMo URL → User thanh toán → Callback → balance tăng → KHÔNG escrow (trả bằng MoMo)
- Output: Đơn đã thanh toán nhưng tiền customer là real money

### 4. **Release Escrow** (Order Delivered)
- Input: `orderId`
- Process: status='escrowed' → 'completed', giảm escrowBalance
- Output: Tiền KHÔNG giữ nữa, sẵn sàng phân chia

### 5. **Distribute Earnings** (Chia tiền cho Restaurant, Driver, Platform)
- Input: `order` với `restaurantRevenue`, `driverPayment`, `platformFeeAmount`
- Process: Credit vào ví từng bên
- Output: Mỗi bên nhận tiền tương ứng

### 6. **Refund Escrow** (Order Cancelled)
- Input: `orderId`
- Process: status='escrowed' → 'cancelled', escrowBalance → balance
- Output: Hoàn tiền cho customer

---

## 🔒 Bảo mật & Atomic Operations

### 1. **MongoDB Transactions**
- Mọi thao tác update wallet đều dùng `session.withTransaction()`
- Đảm bảo atomic: hoặc tất cả thành công, hoặc tất cả rollback

### 2. **Deduplication**
- Unique index cho `orderId + status='completed'` → tránh thanh toán 2 lần
- Unique index cho `providerTransactionId + status='completed'` → tránh credit 2 lần

### 3. **Validation**
- Min deposit: 10k VND
- Max deposit: 10M VND
- Min withdraw: 50k VND
- Max withdraw: 5M VND

### 4. **Escrow Pattern**
- Tiền KHÔNG trả cho restaurant ngay khi thanh toán
- Tiền GIỮ trong escrowBalance
- Chỉ release khi delivered
- Refund nếu cancel

---

## 📝 Key Takeaways

1. **3 loại balance**: available, pending, escrow
2. **Thanh toán bằng ví**: Dùng escrow, chờ delivered mới release
3. **Thanh toán bằng MoMo**: Không cần escrow (real money)
4. **Atomic**: Mọi update đều dùng transaction
5. **Deduplication**: Unique index tránh trùng lặp
6. **Validation**: Min/max amount cho mọi giao dịch

---

**Flow hoàn chỉnh:** Customer Nạp → Thanh Toán → Escrow Hold → Delivered → Release Escrow → Distribute Earnings → Xong!

