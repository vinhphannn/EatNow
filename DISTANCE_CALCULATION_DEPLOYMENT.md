# 🚚 Triển Khai Tính Năng Tính Khoảng Cách Giao Hàng

## 📋 Tổng Quan

Tính năng tính khoảng cách giao hàng đã được triển khai hoàn chỉnh với các thành phần:

- ✅ **Frontend**: Tính toán khoảng cách real-time
- ✅ **Backend**: Lưu trữ khoảng cách vào database
- ✅ **Database**: Schema MongoDB với field `deliveryDistance`
- ✅ **API**: Endpoint tạo đơn hàng với khoảng cách

## 🚀 Cách Triển Khai

### 1. Khởi Động Backend

```bash
cd backend
npm run build
npm start
```

Hoặc sử dụng script:
```bash
cd backend
start-and-test.bat
```

### 2. Khởi Động Frontend

```bash
cd frontend
npm run build
npm start
```

Hoặc sử dụng script:
```bash
cd frontend
start-and-test.bat
```

## 🧪 Cách Test

### 1. Test Frontend

1. Truy cập: `http://localhost:3000/customer/cart`
2. Thêm món ăn vào giỏ hàng
3. Chọn địa chỉ giao hàng
4. Kiểm tra:
   - ✅ Khoảng cách hiển thị (km)
   - ✅ Phí giao hàng được tính
   - ✅ Tổng cộng chính xác
5. Đặt hàng và kiểm tra thông báo thành công

### 2. Test Backend API

```bash
cd backend
node test-order-creation.js
```

### 3. Kiểm Tra Database

```bash
cd backend
node check-orders.js
```

## 📊 Dữ Liệu Được Lưu

### Order Collection
```json
{
  "_id": "ObjectId",
  "customerId": "ObjectId",
  "restaurantId": "ObjectId",
  "items": [...],
  "total": 150000,
  "deliveryFee": 5000,
  "finalTotal": 155000,
  "deliveryAddress": {
    "addressLine": "123 Đường ABC",
    "latitude": 10.7769,
    "longitude": 106.7009
  },
  "deliveryDistance": 5.2,  // ⭐ KHOẢNG CÁCH (km)
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## 🎯 Tính Năng Chính

### 1. Tính Khoảng Cách
- **Công thức**: Haversine formula
- **Đơn vị**: Kilometers
- **Real-time**: Cập nhật khi thay đổi địa chỉ

### 2. Tính Phí Giao Hàng
- **Miễn phí**: ≤ 3km
- **Phí bổ sung**: 5.000đ mỗi 5km (từ km thứ 4)
- **Tính theo block**: Làm tròn lên

### 3. Hiển Thị Thông Tin
- **Khoảng cách từng nhà hàng**
- **Tổng khoảng cách**
- **Phí giao hàng chi tiết**
- **Thông tin chính sách**

## 🔧 API Endpoints

### Tạo Đơn Hàng
```
POST /api/v1/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [...],
  "deliveryAddress": {...},
  "deliveryDistance": 5.2,  // km
  "deliveryFee": 5000,      // VND
  "paymentMethod": "cash",
  "finalTotal": 155000
}
```

### Lấy Đơn Hàng
```
GET /api/v1/orders/customer
Authorization: Bearer <token>
```

## 📈 Lợi Ích

### Cho Customer
- ✅ Biết chính xác phí giao hàng
- ✅ Thấy khoảng cách giao hàng
- ✅ Tính toán tổng chi phí

### Cho Driver
- ✅ Biết khoảng cách cần giao
- ✅ Ước tính thời gian giao hàng
- ✅ Tính toán chi phí xăng xe

### Cho Restaurant
- ✅ Biết phạm vi giao hàng
- ✅ Tính toán chi phí vận hành
- ✅ Tối ưu khu vực giao hàng

### Cho System
- ✅ Lưu trữ dữ liệu lịch sử
- ✅ Phân tích hiệu suất giao hàng
- ✅ Tối ưu thuật toán phân phối

## 🐛 Troubleshooting

### Lỗi Thường Gặp

1. **Khoảng cách hiển thị 0km**
   - Kiểm tra tọa độ nhà hàng và địa chỉ giao hàng
   - Đảm bảo có chọn địa chỉ giao hàng

2. **Phí giao hàng không đúng**
   - Kiểm tra logic tính phí trong frontend
   - Xem console log để debug

3. **Đơn hàng không tạo được**
   - Kiểm tra backend có chạy không
   - Xem log backend để debug

### Debug Commands

```bash
# Kiểm tra backend
curl http://localhost:3001/status

# Kiểm tra database
cd backend && node check-orders.js

# Xem log backend
cd backend && npm start
```

## 📝 Ghi Chú

- Khoảng cách được tính bằng đường chim bay (Haversine formula)
- Phí giao hàng được tính theo quy tắc: miễn phí ≤3km, 5k/5km từ km thứ 4
- Dữ liệu được lưu vào MongoDB với field `deliveryDistance`
- Frontend tính toán real-time, backend lưu trữ và xử lý

## 🎉 Kết Luận

Tính năng tính khoảng cách giao hàng đã được triển khai hoàn chỉnh và sẵn sàng sử dụng! 🚀






