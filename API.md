# 🔌 EatNow API Documentation

## Base URL
```
http://localhost:3001/api/v1
```

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 👤 User Management

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phone": "0123456789",
  "role": "customer"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## 🏪 Restaurant Management

### Get All Restaurants
```http
GET /restaurants
```

### Get Restaurant by ID
```http
GET /restaurants/:id
```

### Get Restaurant Menu
```http
GET /restaurants/:id/items
```

## 🛒 Cart Management

### Get Cart
```http
GET /cart
Authorization: Bearer <token>
```

### Add Item to Cart
```http
POST /cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "item_id",
  "quantity": 2,
  "restaurantId": "restaurant_id"
}
```

### Update Cart Item
```http
PUT /cart/items/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove Cart Item
```http
DELETE /cart/items/:itemId
Authorization: Bearer <token>
```

## 📦 Order Management

### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "itemId": "item_id",
      "quantity": 2,
      "price": 50000
    }
  ],
  "deliveryAddress": {
    "label": "Nhà",
    "addressLine": "123 Test Street",
    "latitude": 10.123456,
    "longitude": 106.123456,
    "city": "TP. Hồ Chí Minh",
    "ward": "Bến Nghé",
    "phone": "0123456789",
    "recipientName": "Test User"
  },
  "paymentMethod": "cash",
  "totalAmount": 100000
}
```

### Get Customer Orders
```http
GET /orders/customer
Authorization: Bearer <token>
```

### Get Restaurant Orders
```http
GET /orders/restaurant
Authorization: Bearer <token>
```

### Update Order Status
```http
PUT /orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```

## 🚗 Driver Management

### Get Available Orders
```http
GET /orders/available
Authorization: Bearer <token>
```

### Accept Order
```http
POST /orders/:id/accept
Authorization: Bearer <token>
```

### Update Delivery Status
```http
PUT /orders/:id/delivery-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "picked_up"
}
```

## 📍 Address Management

### Get Customer Addresses
```http
GET /customer/addresses
Authorization: Bearer <token>
```

### Add Address
```http
POST /customer/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Nhà",
  "addressLine": "123 Test Street",
  "latitude": 10.123456,
  "longitude": 106.123456,
  "city": "TP. Hồ Chí Minh",
  "ward": "Bến Nghé",
  "phone": "0123456789",
  "recipientName": "Test User",
  "isDefault": true
}
```

## 🔔 Real-time Notifications

Connect to WebSocket for real-time updates:
```javascript
const socket = io('http://localhost:3001');

// Listen for order updates
socket.on('orderUpdate', (order) => {
  console.log('Order updated:', order);
});

// Listen for new orders (restaurant)
socket.on('newOrder', (order) => {
  console.log('New order:', order);
});
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 🔍 Order Status Flow

1. `pending` - Order placed, waiting for restaurant confirmation
2. `confirmed` - Restaurant confirmed the order
3. `preparing` - Restaurant is preparing the food
4. `ready` - Food is ready for pickup
5. `picked_up` - Driver picked up the order
6. `delivered` - Order delivered to customer
7. `cancelled` - Order cancelled

## 🚨 Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
