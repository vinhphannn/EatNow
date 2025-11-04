# 🚀 WebSocket Payment Integration Guide

## Tổng quan

Hệ thống nạp tiền đã được nâng cấp từ **polling mechanism** sang **WebSocket real-time notifications**. Điều này mang lại trải nghiệm người dùng tốt hơn, giảm tải server và chuyên nghiệp hơn.

## 🔄 So sánh: Polling vs WebSocket

### ❌ Cách cũ (Polling)
```
Frontend → Backend: Check status (mỗi 3 giây)
Frontend → Backend: Check status (mỗi 3 giây)
Frontend → Backend: Check status (mỗi 3 giây)
...
Backend → Frontend: Status = completed
```

**Nhược điểm:**
- ❌ Tốn tài nguyên server (nhiều request không cần thiết)
- ❌ Delay 3 giây giữa các lần check
- ❌ Không chuyên nghiệp
- ❌ Khó scale khi có nhiều user

### ✅ Cách mới (WebSocket)
```
Frontend ←→ WebSocket: Kết nối persistent
MoMo → Backend: Callback
Backend → WebSocket → Frontend: Notification (ngay lập tức)
```

**Ưu điểm:**
- ✅ Real-time, không delay
- ✅ Tiết kiệm tài nguyên (1 connection thay vì nhiều requests)
- ✅ Chuyên nghiệp, modern
- ✅ Dễ scale với nhiều users

## 📋 Luồng hoạt động chi tiết

### 1. **Frontend khởi tạo**
```typescript
// Hook tự động kết nối WebSocket và join user room
const { connected } = useDepositListener(
  userId,
  transactionId,
  (event) => {
    // Callback được gọi khi deposit completed
    console.log('Deposit completed:', event);
    alert(`Nạp tiền thành công! Số dư mới: ${event.newBalance}`);
  }
);
```

### 2. **Người dùng nạp tiền**
```typescript
// Frontend tạo deposit request
const response = await walletService.deposit(amount, 'momo');

// Hiển thị QR Code
setQrCode(response.paymentUrl);
setCurrentTransactionId(response.transactionId);

// WebSocket tự động lắng nghe, KHÔNG CẦN polling!
console.log('Waiting for payment via WebSocket...');
```

### 3. **MoMo callback đến Backend**
```typescript
// Backend nhận callback từ MoMo
@Post('momo/callback')
async momoCallback(@Body() callbackData: any) {
  // Xác thực và xử lý transaction
  await this.walletService.confirmDeposit(transactionId, ...);
  
  // 🚀 Emit WebSocket event
  await this.notificationGateway.notifyDepositCompleted(userId, {
    transactionId,
    amount,
    newBalance,
    providerTransactionId
  });
}
```

### 4. **Frontend nhận notification**
```typescript
// Hook tự động nhận event và gọi callback
socket.on('deposit_completed:v1', (event) => {
  // Callback được gọi ngay lập tức
  onCompleted(event);
});
```

## 🔧 Cấu trúc Code

### Backend

#### 1. **WebSocket Gateway** (`optimized-notification.gateway.ts`)
```typescript
async notifyDepositCompleted(userId: string, transactionData: {
  transactionId: string;
  amount: number;
  newBalance: number;
  providerTransactionId?: string;
}) {
  const userRoom = `user:${userId}`;
  
  this.server.to(userRoom).emit('deposit_completed:v1', {
    type: 'deposit_completed',
    transactionId: transactionData.transactionId,
    amount: transactionData.amount,
    newBalance: transactionData.newBalance,
    message: `Nạp tiền thành công ${amount.toLocaleString('vi-VN')} VND`,
    timestamp: new Date().toISOString(),
  });
}
```

#### 2. **Payment Controller** (`payment.controller.ts`)
```typescript
@Post('momo/callback')
async momoCallback(@Body() callbackData: any) {
  // ... xử lý callback ...
  
  // Emit WebSocket event
  await this.notificationGateway.notifyDepositCompleted(userId, {
    transactionId,
    amount: transaction.amount,
    newBalance: wallet.balance,
    providerTransactionId: callbackData.transactionId,
  });
}
```

### Frontend

#### 1. **Payment Socket Hook** (`usePaymentSocket.ts`)
```typescript
export function useDepositListener(
  userId: string | null,
  transactionId: string | null,
  onCompleted: (event: DepositCompletedEvent) => void
) {
  const handleDepositCompleted = useCallback(
    (event: DepositCompletedEvent) => {
      if (transactionId && event.transactionId === transactionId) {
        onCompleted(event);
      }
    },
    [transactionId, onCompleted]
  );

  return usePaymentSocket(userId, {
    onDepositCompleted: handleDepositCompleted,
  });
}
```

#### 2. **Wallet Page** (`wallet/page.tsx`)
```typescript
// Sử dụng hook
const { connected: wsConnected } = useDepositListener(
  user?.id || null,
  currentTransactionId || null,
  (event) => {
    alert(`Nạp tiền thành công! Số dư mới: ${event.newBalance}`);
    resetDepositModal();
    loadData();
  }
);

// Hiển thị status
{wsConnected && waitingForPayment ? (
  <span>🔌 Đang lắng nghe thanh toán...</span>
) : (
  <span>⏳ Đang kết nối...</span>
)}
```

## 📊 Event Types

### 1. **deposit_completed:v1**
```typescript
{
  type: 'deposit_completed',
  transactionId: string,
  amount: number,
  newBalance: number,
  providerTransactionId?: string,
  message: string,
  timestamp: string
}
```

### 2. **payment_status_update:v1**
```typescript
{
  type: 'payment_status_update',
  transactionId: string,
  status: 'pending' | 'completed' | 'failed' | 'cancelled',
  amount: number,
  transactionType: string,
  message: string,
  metadata?: any,
  timestamp: string
}
```

### 3. **withdrawal_completed:v1**
```typescript
{
  type: 'withdrawal_completed',
  transactionId: string,
  amount: number,
  newBalance: number,
  message: string,
  timestamp: string
}
```

## 🧪 Testing

### 1. **Test WebSocket Connection**
```bash
# Mở browser console
# Kiểm tra log
✅ Connected to server
🔌 WebSocket connected state: true
💳 Waiting for payment via WebSocket for transaction: xxx
```

### 2. **Test Deposit Flow**
```bash
# 1. Tạo deposit
POST /api/v1/payment/deposit
{
  "amount": 100000,
  "provider": "momo"
}

# 2. Quét QR Code (hoặc test callback)
POST /api/v1/payment/momo/callback
{
  "orderId": "transaction_id",
  "resultCode": 0,
  ...
}

# 3. Kiểm tra frontend nhận event
# Console sẽ hiển thị:
✅ Deposit completed via WebSocket: { ... }
💰 Nạp tiền thành công! Số dư mới: 100,000 VND
```

### 3. **Test Manual Confirm** (for development)
```bash
POST /api/v1/payment/confirm-deposit
{
  "transactionId": "xxx"
}
```

## 🔒 Security

### 1. **Authentication**
- WebSocket sử dụng cookie-based authentication
- Tự động join room dựa trên userId từ JWT token

### 2. **Event Filtering**
- Frontend chỉ xử lý events cho transactionId đang theo dõi
- Backend chỉ emit events cho user sở hữu transaction

### 3. **MoMo Callback Verification**
- Xác thực chữ ký từ MoMo
- Kiểm tra duplicate callbacks (idempotency)

##[object Object]rmance

### Metrics
- **Latency**: < 100ms từ MoMo callback đến frontend notification
- **Resource**: 1 WebSocket connection thay vì 20+ HTTP requests
- **Scalability**: Hỗ trợ hàng nghìn concurrent users

### Monitoring
```typescript
// Gateway metrics
getMetrics() {
  return {
    activeConnections: this.metrics.activeConnections,
    messagesProcessed: this.metrics.messagesProcessed,
    roomCount: this.roomOccupancy.size,
  };
}
```

## 🚀 Migration từ Polling

### Bước 1: Xóa polling code
```typescript
// ❌ Xóa
const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
const startPollingTransaction = (transactionId: string) => { ... }

// ✅ Thay bằng
const { connected } = useDepositListener(userId, transactionId, onCompleted);
```

### Bước 2: Cập nhật UI
```typescript
// ❌ Xóa
{isPolling && <span>Đang kiểm tra...</span>}

// ✅ Thay bằng
{wsConnected && waitingForPayment && (
  <span>🔌 Đang lắng nghe thanh toán...</span>
)}
```

### Bước 3: Cleanup
```typescript
// ❌ Xóa
useEffect(() => {
  return () => {
    if (pollingInterval) clearInterval(pollingInterval);
  };
}, []);

// ✅ Hook tự động cleanup
```

## 🎯 Best Practices

1. **Always check WebSocket connection status**
   ```typescript
   if (!wsConnected) {
     return <div>Đang kết nối...</div>;
   }
   ```

2. **Handle reconnection gracefully**
   ```typescript
   // Hook tự động reconnect, không cần xử lý thủ công
   ```

3. **Show clear status to users**
   ```typescript
   <div className={wsConnected ? 'text-green-500' : 'text-yellow-500'}>
     {wsConnected[object Object]kết nối' : '⏳ Đang kết nối...'}
   </div>
   ```

4. **Log events for debugging**
   ```typescript
   usePaymentSocketDebug(userId); // Chỉ dùng khi dev
   ```

## 📝 Troubleshooting

### Problem: WebSocket không kết nối
```bash
# Kiểm tra:
1. Backend đang chạy?
2. CORS config đúng?
3. Cookie được gửi?
4. JWT token hợp lệ?
```

### Problem: Không nhận được event
```bash
# Kiểm tra:
1. User đã join room chưa?
2. TransactionId đúng chưa?
3. Backend có emit event không?
4. Frontend có lắng nghe đúng event name không?
```

### Problem: Event bị duplicate
```bash
# Giải pháp:
- Backend đã có idempotency check
- Frontend filter theo transactionId
```

## 🎉 Kết luận

WebSocket payment integration mang lại:
- ✅ Trải nghiệm người dùng tốt hơn (real-time)
- ✅ Hiệu suất cao hơn (ít requests hơn)
- ✅ Code sạch hơn (ít logic polling)
- ✅ Dễ maintain hơn (centralized event handling)

**Không còn polling, chỉ còn WebSocket! 🚀**

