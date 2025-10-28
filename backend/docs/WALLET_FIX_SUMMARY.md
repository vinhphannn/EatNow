# ✅ Tóm tắt Fix Wallet System

## 🐛 Vấn đề gốc

```
E11000 duplicate key error collection: eatnow.wallets 
index: type_1_ownerId_1 dup key: { type: null, ownerId: null }
```

**Nguyên nhân:**
- Database cũ có index `type_1_ownerId_1` không match với schema mới
- Index này có `type` và `ownerId` nhưng schema mới dùng `ownerType` và `userId/restaurantId/driverId`
- Khi create wallet → conflict với index cũ

## ✅ Giải pháp đã thực hiện

### 1. **Fix Schema** (`wallet.schema.ts`)
- ✅ Thêm `escrowBalance: 0` vào tất cả chỗ tạo wallet
- ✅ Indexes mới:
  - `userId + ownerType` (unique, sparse)
  - `restaurantId + ownerType` (unique, sparse)
  - `driverId + ownerType` (unique, sparse)
  - `isSystemWallet`
  - `ownerType`
  - `escrowBalance`

### 2. **Fix Service** (`wallet.service.ts`)
- ✅ Thêm `escrowBalance: 0` khi tạo wallet
- ✅ Return `escrowBalance` trong `getBalanceForActor()`
- ✅ Fallback `escrowBalance || 0` cho database cũ

### 3. **Fix Controller** (`customer-wallet.controller.ts`)
- ✅ Thêm logging để debug
- ✅ Return `escrowBalance: 0` nếu không có wallet
- ✅ Better error handling

### 4. **Fix Frontend** (`customer/wallet/page.tsx`)
- ✅ UI "Create Wallet" nếu không có ví
- ✅ Button "Tạo ví ngay" để trigger creation
- ✅ Loading state khi creating

### 5. **Fix Script** (`scripts/fix-wallet-indexes.js`)
- ✅ Created collection nếu chưa có
- ✅ Ready để drop old indexes

## 🔧 Cách test

### 1. **Restart backend**
```bash
cd backend
npm run start:dev
```

### 2. **Clear old indexes** (nếu cần)
```bash
# MongoDB shell
db.wallets.dropIndexes()
db.wallets.getIndexes()
```

### 3. **Test API**
```bash
# 1. Login
POST http://localhost:3001/api/v1/auth/login

# 2. Get wallet balance
GET http://localhost:3001/api/v1/customer/wallet/balance
Authorization: Bearer <token>

# Expected response:
{
  "balance": 0,
  "pendingBalance": 0,
  "escrowBalance": 0,
  "totalDeposits": 0,
  "totalWithdrawals": 0,
  "isActive": true
}
```

### 4. **Test frontend**
```
1. Go to http://localhost:3003/customer/wallet
2. Nếu chưa có ví → Hiển thị UI "Create Wallet"
3. Click "Tạo ví ngay"
4. Backend tự tạo ví với đầy đủ escrowBalance
5. Reload → Hiển thị wallet bình thường
```

## 📊 Wallet Creation Flow

```
1. User register
   ↓
2. auth.service.ts: register()
   - Tạo User
   - Tạo Customer profile
   - ✅ Tự động gọi walletService.getWalletForActor()
   ↓
3. wallet.service.ts: getWalletForActor()
   - Check wallet exists
   - Nếu chưa có → Tạo mới với:
     {
       balance: 0,
       pendingBalance: 0,
       escrowBalance: 0, // ✅ ĐÃ THÊM
       totalDeposits: 0,
       totalWithdrawals: 0,
       isActive: true
     }
   ↓
4. Return wallet
```

## 🎯 Next Steps

1. ✅ **DONE**: Fix schema + escrowBalance
2. ✅ **DONE**: Fix auto-create wallet
3. ✅ **DONE**: UI create wallet button
4. ⏳ **TODO**: Test với real user data

## 🔍 Debug Commands

```bash
# Check wallet in database
db.wallets.find({ ownerType: 'customer' }).pretty()

# Check indexes
db.wallets.getIndexes()

# Check if wallet has escrowBalance
db.wallets.find({ escrowBalance: { $exists: true } }).count()

# Update old wallets to add escrowBalance
db.wallets.updateMany(
  { escrowBalance: { $exists: false } },
  { $set: { escrowBalance: 0 } }
)
```

## ✅ Status

- ✅ Schema fixed
- ✅ Service fixed
- ✅ Controller fixed
- ✅ Frontend fixed
- ✅ Scripts ready
- ✅ Collection created
- ⏳ Testing in progress

**Lỗi 500 sẽ biến mất khi:**
1. Backend restart
2. User tạo mới hoặc gọi API wallet lần đầu
3. Collection indexes được rebuild

