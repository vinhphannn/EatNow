# 🧪 Test Orders API Guide

## 🐛 **Vấn Đề:**
Frontend gọi API `/api/v1/orders/customer` nhưng bị lỗi 404 hoặc 401.

## 🔍 **Nguyên Nhân:**
1. **Backend chưa chạy** - API không accessible
2. **Token không được gửi** - Frontend không gửi Authorization header
3. **Token expired** - Token đã hết hạn
4. **URL sai** - Frontend gọi sai endpoint

## 🔧 **Giải Pháp Đã Thực Hiện:**

### **1. Cập Nhật API Client**
```typescript
// frontend/src/services/api.client.ts
// Thêm logic gửi token trong Authorization header
const token = typeof window !== 'undefined' ? localStorage.getItem('eatnow_token') : null;
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

### **2. Cập Nhật Order Service**
```typescript
// backend/src/order/order.service.ts
// Sử dụng CustomerService để tìm customer profile trước
const customer = await this.customerService.getCustomerByUserId(userId);
const orders = await this.orderModel.find({ customerId: customer._id });
```

## 🧪 **Cách Test:**

### **Bước 1: Kiểm tra Backend**
```bash
# Test API trực tiếp
curl http://localhost:3001/api/v1/orders/customer
# Expected: {"message":"Missing token","error":"Unauthorized","statusCode":401}
```

### **Bước 2: Lấy Token từ Browser**
```javascript
// Trong browser console (F12)
console.log('Token:', localStorage.getItem('eatnow_token'));
```

### **Bước 3: Test với Token**
```bash
# Test với token thật
node test-with-real-token.js YOUR_JWT_TOKEN_HERE
```

### **Bước 4: Test Frontend**
1. **Mở browser** và đăng nhập
2. **Vào trang** `/customer/orders`
3. **Mở DevTools** (F12) và xem Network tab
4. **Kiểm tra request** có gửi Authorization header không

## 🔍 **Debug Steps:**

### **1. Kiểm tra Token**
```javascript
// Browser console
const token = localStorage.getItem('eatnow_token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
console.log('Token preview:', token?.substring(0, 20) + '...');
```

### **2. Kiểm tra API Call**
```javascript
// Browser console
fetch('/api/v1/orders/customer', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('eatnow_token')}`
  }
}).then(r => r.json()).then(console.log);
```

### **3. Kiểm tra Backend Logs**
```bash
# Backend terminal
# Xem logs khi frontend gọi API
```

## 📊 **Expected Results:**

### **Success Response:**
```json
[
  {
    "_id": "68c34a328abceb148a35ee10",
    "orderCode": "ORD082728Q0Y",
    "status": "pending",
    "finalTotal": 30004,
    "restaurantId": {
      "_id": "68c3d73baec4b52ec97e8fb5",
      "name": "Nhà hàng",
      "address": "Chưa có địa chỉ",
      "phone": "0123456789"
    },
    "driverId": null,
    "deliveryAddress": {
      "label": "Chỗ làm",
      "addressLine": "54 lê đức thọ",
      "latitude": 10.815433632663554,
      "longitude": 106.63733482360841
    }
  }
]
```

### **Error Responses:**
- **401 Unauthorized**: Token missing hoặc expired
- **404 Not Found**: Backend chưa chạy hoặc URL sai
- **500 Internal Server Error**: Backend error

## 🚀 **Quick Fix:**

### **Nếu vẫn lỗi 404:**
1. **Kiểm tra backend** có chạy không: `curl http://localhost:3001/api/v1/orders/customer`
2. **Restart backend**: `npm run start:dev`
3. **Kiểm tra port**: Backend chạy trên port 3001

### **Nếu vẫn lỗi 401:**
1. **Kiểm tra token** có trong localStorage không
2. **Đăng nhập lại** để lấy token mới
3. **Kiểm tra token format**: Phải bắt đầu bằng `eyJ`

### **Nếu vẫn lỗi 500:**
1. **Kiểm tra backend logs** để xem error chi tiết
2. **Kiểm tra database** connection
3. **Kiểm tra customer profiles** có được tạo không

## 📋 **Checklist:**

- [ ] Backend đang chạy trên port 3001
- [ ] Token có trong localStorage
- [ ] Token format đúng (JWT)
- [ ] API client gửi Authorization header
- [ ] Customer profiles đã được tạo
- [ ] Orders đã được map với customer profiles

**Sau khi fix, trang `/customer/orders` sẽ hiển thị orders đúng! 🎉**






