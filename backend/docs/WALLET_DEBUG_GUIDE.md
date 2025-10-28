# 🔧 Wallet System Debug Guide

## ❌ Lỗi hiện tại

```
GET http://localhost:3001/api/v1/customer/wallet/balance 500 (Internal Server Error)
GET http://localhost:3001/api/v1/customer/wallet/transactions?limit=50 500 (Internal Server Error)
```

## 🔍 Nguyên nhân có thể

### 1. `actorId` rỗng
- `resolveActorRefFromReq(req, 'customer')` không lấy được `actorId`
- Frontend không gửi đúng auth token
- Backend chưa có user trong request

### 2. Wallet chưa được tạo
- Customer đăng ký nhưng wallet không được tạo
- `getWalletForActor()` throw error khi create

### 3. Schema không match
- `escrowBalance` chưa có trong database cũ
- Cần migration data

## ✅ Cách debug

### 1. Check backend logs
```bash
cd backend
npm run start:dev
```

Look for:
```
🔍 Customer Wallet: Request user: { id: 'xxx', ... }
🔍 Customer Wallet: Resolved actor: { ownerType: 'customer', actorId: 'xxx' }
✅ Customer Wallet: Balance retrieved: { balance: 0, ... }
```

### 2. Test API manually
```bash
# 1. Login để lấy token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@test.com", "password": "password"}'

# 2. Lấy token từ response
# 3. Call wallet API
curl -X GET http://localhost:3001/api/v1/customer/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3. Check database
```javascript
// MongoDB shell
db.wallets.find({ ownerType: 'customer' }).pretty()
```

Expected:
```json
{
  "_id": ObjectId("..."),
  "ownerType": "customer",
  "userId": ObjectId("..."),
  "balance": 0,
  "pendingBalance": 0,
  "escrowBalance": 0, // ✅ Cần có
  "totalDeposits": 0,
  "totalWithdrawals": 0,
  "isActive": true
}
```

## 🔧 Fix immediate

### Fix 1: Thêm error handling cho escrowBalance cũ
```typescript
// Nếu database cũ chưa có escrowBalance
async getBalanceForActor(actor: ActorRef) {
  const wallet = await this.getWalletForActor(actor.ownerType, actor.actorId);
  return {
    balance: wallet.balance || 0,
    pendingBalance: wallet.pendingBalance || 0,
    escrowBalance: wallet.escrowBalance || 0, // ✅ Fallback
    // ...
  };
}
```

### Fix 2: Migration script
```javascript
// scripts/migrate-escrow-balance.js
db.wallets.updateMany(
  { escrowBalance: { $exists: false } },
  { $set: { escrowBalance: 0 } }
);
```

## 📝 Frontend fix

### Check frontend wallet service
`frontend/src/services/wallet.service.ts` line 66-82:
```typescript
async getBalance(): Promise<WalletBalance> {
  try {
    console.log('🔍 WalletService: Calling getBalance API...');
    const response: any = await apiClient.get('/customer/wallet/balance');
    console.log('🔍 WalletService: Full response:', response);
    
    // ✅ Response should have escrowBalance
    return response;
  } catch (error: any) {
    console.error('🔍 WalletService: getBalance error:', error);
    throw new Error(error.response?.data?.error || 'Không thể lấy số dư ví');
  }
}
```

### Update WalletBalance interface
```typescript
export interface WalletBalance {
  balance: number;
  pendingBalance: number;
  escrowBalance?: number; // ✅ Thêm optional
  totalDeposits: number;
  totalWithdrawals: number;
  isActive: boolean;
}
```

## 🚀 Quick fix

1. **Restart backend**: `npm run start:dev`
2. **Clear cookies** trên browser
3. **Login lại** để tạo wallet mới với escrowBalance
4. **Refresh** wallet page

## 📊 Expected response

```json
{
  "balance": 0,
  "pendingBalance": 0,
  "escrowBalance": 0,
  "totalDeposits": 0,
  "totalWithdrawals": 0,
  "isActive": true
}
```

