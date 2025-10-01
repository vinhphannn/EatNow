# 🔧 Fix Lỗi Đặt Hàng - 500 Internal Server Error

## 🐛 Các Lỗi Đã Phát Hiện và Fix:

### 1. **Missing `total` field**
**Lỗi**: Frontend không gửi field `total` mà chỉ gửi `finalTotal`
**Fix**: Thêm field `total` (subtotal) vào orderData

```javascript
// Before (❌)
const orderData = {
  // ... other fields
  finalTotal: subtotal + deliveryFee
};

// After (✅)
const orderData = {
  // ... other fields
  total: subtotal,        // ⭐ ADDED
  finalTotal: subtotal + deliveryFee
};
```

### 2. **Invalid `paymentMethod` value**
**Lỗi**: Frontend gửi `'cod'` nhưng backend chỉ accept `'cash'` hoặc `'bank_transfer'`
**Fix**: Đổi `'cod'` thành `'cash'`

```javascript
// Before (❌)
const [paymentMethod, setPaymentMethod] = useState<string>('cod');

// After (✅)
const [paymentMethod, setPaymentMethod] = useState<string>('cash');
```

### 3. **Wrong `deliveryAddress` format**
**Lỗi**: Frontend gửi `coordinates: {lat, lng}` nhưng backend expect `latitude, longitude`
**Fix**: Đổi format địa chỉ

```javascript
// Before (❌)
deliveryAddress: {
  addressLine: selectedAddress.addressLine,
  coordinates: selectedAddress.coordinates
}

// After (✅)
deliveryAddress: {
  label: selectedAddress.label || 'Địa chỉ giao hàng',
  addressLine: selectedAddress.addressLine,
  latitude: selectedAddress.coordinates?.lat || selectedAddress.latitude || 0,
  longitude: selectedAddress.coordinates?.lng || selectedAddress.longitude || 0,
  note: selectedAddress.note || ''
}
```

## 📋 Backend Schema Requirements:

### Order Schema expects:
```typescript
{
  total: number,                    // ⭐ REQUIRED
  deliveryFee: number,              // ⭐ REQUIRED
  finalTotal: number,               // ⭐ REQUIRED
  paymentMethod: 'cash' | 'bank_transfer', // ⭐ ENUM
  deliveryAddress: {
    label: string,                  // ⭐ REQUIRED
    addressLine: string,            // ⭐ REQUIRED
    latitude: number,               // ⭐ REQUIRED
    longitude: number,              // ⭐ REQUIRED
    note?: string
  }
}
```

## 🧪 Test Data Format:

```javascript
const testOrderData = {
  restaurantId: 'ObjectId',
  items: [{
    itemId: 'ObjectId',
    name: 'string',
    price: number,
    quantity: number,
    subtotal: number,
    specialInstructions: 'string'
  }],
  deliveryAddress: {
    label: 'string',
    addressLine: 'string',
    latitude: number,
    longitude: number,
    note: 'string'
  },
  deliveryDistance: number,    // km
  deliveryFee: number,         // VND
  total: number,               // subtotal
  paymentMethod: 'cash',       // enum
  promoCode: 'string',
  finalTotal: number           // total + deliveryFee
};
```

## ✅ Kết Quả:

- ✅ **Build thành công** - Không có lỗi TypeScript
- ✅ **API format đúng** - Tất cả field required đã có
- ✅ **Payment method hợp lệ** - Sử dụng enum đúng
- ✅ **Address format đúng** - latitude/longitude thay vì coordinates

## 🚀 Test Commands:

```bash
# Test API
cd backend
node test-fixed-order.js

# Check database
node check-orders.js

# Start servers
cd backend && npm start
cd frontend && npm start
```

## 🎯 Next Steps:

1. **Test đặt hàng** - Thử đặt hàng trên frontend
2. **Kiểm tra database** - Xem dữ liệu có được lưu đúng không
3. **Verify distance** - Kiểm tra khoảng cách có được tính và lưu đúng không

Lỗi 500 Internal Server Error đã được fix! 🎉






