# Wallet Schema Guide

## Tổng quan
Hệ thống ví multi-actor với luồng escrow mới để đảm bảo an toàn tài chính.

## Luồng Escrow Mới

### 1. Khi Customer đặt đơn:
```
Customer Balance → Platform EscrowBalance
- Trừ balance của customer
- Tăng escrowBalance của platform wallet
- Transaction status = 'escrowed'
```

### 2. Khi Order delivered:
```
Platform EscrowBalance → Restaurant + Driver + Platform Fee
- Giảm escrowBalance của platform wallet
- Tăng balance của restaurant wallet
- Tăng balance của driver wallet  
- Giữ lại platform fee trong balance của platform wallet
```

## Wallet Schema

### Actors (Chỉ cần 1 trong 4):
- **customer**: Ví khách hàng (`userId`)
- **restaurant**: Ví nhà hàng (`restaurantId`)
- **driver**: Ví tài xế (`driverId`)
- **admin**: Ví platform/system (`isSystemWallet = true`)

### Balance Fields:
- **balance**: Số dư khả dụng (có thể rút/nạp)
- **pendingBalance**: Tiền đang chờ xác nhận từ MoMo/ZaloPay
- **escrowBalance**: Tiền đang giữ cho orders (chỉ platform wallet dùng)
- **totalDeposits/totalWithdrawals**: Thống kê tổng

### Unique Constraints:
- Mỗi actor chỉ có 1 ví duy nhất
- Chỉ có 1 system wallet (`isSystemWallet = true`)

## WalletTransaction Schema

### Transaction Types:
- **deposit**: Nạp tiền vào ví (MoMo/ZaloPay)
- **withdraw**: Rút tiền từ ví ra MoMo/ZaloPay
- **order_payment**: Customer thanh toán đơn hàng (escrow → platform)
- **order_revenue**: Restaurant nhận tiền từ đơn hàng (platform → restaurant)
- **commission**: Driver nhận tiền từ đơn hàng (platform → driver)
- **platform_fee**: Platform thu phí từ đơn hàng (platform giữ lại)
- **refund**: Hoàn tiền cho customer (platform → customer)
- **transfer**: Chuyển tiền nội bộ giữa các ví
- **fee**: Phí dịch vụ khác

### Status:
- **pending**: Đang chờ xử lý (deposit/withdraw)
- **completed**: Hoàn thành thành công
- **failed**: Thất bại
- **cancelled**: Đã hủy
- **escrowed**: Đang giữ (order_payment chưa delivered)

### Idempotency:
- Không tạo duplicate transactions cho cùng `providerTransactionId`
- Không trừ tiền 2 lần cho cùng 1 đơn hàng (`order_payment` + `completed`)

## Các trường quan trọng

### Wallet:
- `ownerType`: Loại ví (customer/restaurant/driver/admin)
- `isSystemWallet`: true = ví platform/system
- `escrowBalance`: Chỉ platform wallet dùng để giữ tiền orders

### WalletTransaction:
- `isSystemTransaction`: true = giao dịch của platform/system
- `amount`: Âm = chi, dương = thu
- `orderId/orderCode`: Link đến đơn hàng (nếu có)

## Lưu ý quan trọng

1. **Escrow chỉ dùng cho platform wallet**: Customer không có escrowBalance
2. **System wallet**: `isSystemWallet = true`, không cần `userId`
3. **Unique constraints**: Tránh tạo trùng ví cho cùng actor
4. **Idempotency**: Tránh duplicate transactions
5. **Indexes**: Tối ưu query performance

## Ví dụ sử dụng

### Tạo ví cho customer:
```typescript
await walletService.getWalletForActor('customer', userId);
```

### Tạo ví cho platform:
```typescript
await walletService.getWalletForActor('admin', 'system');
```

### Thanh toán đơn hàng:
```typescript
await walletService.payOrderFromWallet('customer', customerId, amount, orderId, orderCode);
// → Tiền từ customer balance → platform escrowBalance
```

### Phân chia tiền khi delivered:
```typescript
await walletService.distributeOrderEarnings(order);
// → Tiền từ platform escrowBalance → restaurant + driver + platform fee
```
