# 🍽️ Logic Tách Đơn Hàng Theo Quán

## 🎯 **Mục Tiêu:**
- **Tách đơn hàng theo từng quán** - Mỗi quán sẽ có đơn hàng riêng biệt
- **Tính toán chính xác** - Tránh nhầm lẫn tiền giữa các đơn
- **Hiển thị rõ ràng** - Người dùng thấy được sẽ tạo bao nhiêu đơn

## 🔧 **Logic Tách Đơn:**

### 1️⃣ **Group Items by Restaurant**
```javascript
const groupItemsByRestaurant = () => {
  const groups: { [key: string]: any[] } = {};
  cartItems.forEach(item => {
    const restaurantId = item.restaurant?.id || item.restaurantId;
    
    if (!restaurantId) {
      console.error('Missing restaurant ID for item:', item);
      return; // Skip items without restaurant ID
    }
    
    // Use restaurant ID as primary key
    const key = restaurantId;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  
  return groups;
};
```

### 2️⃣ **Create Separate Orders**
```javascript
// Each restaurant gets its own order
const orderPromises = Object.entries(restaurantGroups).map(async ([restaurantId, items]) => {
  const restaurantName = items[0].restaurant?.name || items[0].restaurantName;
  
  // Calculate totals for THIS restaurant only
  const subtotal = items.reduce((total, item) => {
    const itemSubtotal = item.subtotal || (item.item?.price * item.quantity) || (item.price * item.quantity);
    return total + itemSubtotal;
  }, 0);
  
  const deliveryFee = deliveryFees[restaurantId] || 0;
  const finalTotal = subtotal + deliveryFee;
  
  const orderData = {
    restaurantId, // ⭐ CRITICAL: Each order has correct restaurant ID
    items: items.map(item => ({...})),
    deliveryAddress: {...},
    deliveryDistance: deliveryDistances[restaurantId] || 0,
    deliveryFee: deliveryFee,
    total: subtotal,        // ⭐ Restaurant subtotal only
    paymentMethod,
    finalTotal: finalTotal  // ⭐ Restaurant total + delivery fee
  };

  return apiClient.post(`/api/v1/orders`, orderData);
});
```

## 📊 **Ví Dụ Tách Đơn:**

### **Giỏ hàng có 2 quán:**
```
Quán A: Phở Bò (50k) + Bánh mì (20k) = 70k
Quán B: Cơm tấm (40k) + Nước (10k) = 50k
```

### **Kết quả tạo 2 đơn:**
```
Đơn 1 (Quán A):
- Items: Phở Bò, Bánh mì
- Subtotal: 70,000đ
- Delivery fee: 5,000đ (3.2km)
- Final total: 75,000đ

Đơn 2 (Quán B):
- Items: Cơm tấm, Nước
- Subtotal: 50,000đ
- Delivery fee: 0đ (2.1km - miễn phí)
- Final total: 50,000đ
```

## 🎨 **UI Hiển Thị:**

### **Khi có nhiều quán:**
```
📦 Sẽ tạo 2 đơn hàng riêng biệt:

┌─────────────────────────────────────┐
│ Đơn 1: Quán A               75,000đ │
│ • 2 món                   70,000đ   │
│ • Khoảng cách: 3.2km      5,000đ   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Đơn 2: Quán B               50,000đ │
│ • 2 món                   50,000đ   │
│ • Khoảng cách: 2.1km      Miễn phí │
└─────────────────────────────────────┘
```

### **Khi chỉ có 1 quán:**
```
📦 Đơn hàng sẽ được tạo cho nhà hàng:

┌─────────────────────────────────────┐
│ Đơn 1: Quán A               75,000đ │
│ • 2 món                   70,000đ   │
│ • Khoảng cách: 3.2km      5,000đ   │
└─────────────────────────────────────┘
```

## ✅ **Đảm Bảo Chính Xác:**

### 1️⃣ **Restaurant ID Validation**
- Kiểm tra `restaurantId` có tồn tại
- Skip items không có `restaurantId`
- Log error để debug

### 2️⃣ **Separate Calculations**
- Mỗi quán tính `subtotal` riêng
- Mỗi quán có `deliveryFee` riêng
- Mỗi quán có `finalTotal` riêng

### 3️⃣ **Clear Logging**
```javascript
console.log(`Creating order for restaurant: ${restaurantName} (${restaurantId})`);
console.log(`- Items: ${items.length}`);
console.log(`- Subtotal: ${subtotal}đ`);
console.log(`- Delivery fee: ${deliveryFee}đ`);
console.log(`- Final total: ${finalTotal}đ`);
```

### 4️⃣ **Success Message**
```javascript
// Single order
"Đặt hàng thành công!\nMã đơn hàng: ORD001"

// Multiple orders
"Đặt hàng thành công! Tạo 2 đơn hàng:\nQuán A: ORD001\nQuán B: ORD002"
```

## 🚀 **Kết Quả:**

- ✅ **Mỗi quán có đơn riêng** - Không bị nhầm lẫn
- ✅ **Tính toán chính xác** - Tiền đúng cho từng quán
- ✅ **UI rõ ràng** - Người dùng hiểu được
- ✅ **Logging đầy đủ** - Dễ debug khi có lỗi
- ✅ **Redirect đúng** - Chuyển đến trang đơn hàng

**Logic tách đơn hàng đã được implement hoàn chỉnh và chính xác!** 🎉






