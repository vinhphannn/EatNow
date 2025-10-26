# 🔔 Notification API Documentation

## 📋 **Database Schema**

### Notification Collection
```javascript
{
  _id: ObjectId,
  restaurantId: ObjectId, // Reference to Restaurant
  type: 'new_order' | 'order_status' | 'payment' | 'delivery' | 'system',
  title: String,
  message: String,
  read: Boolean,
  priority: 'low' | 'medium' | 'high',
  orderId: ObjectId?, // Reference to Order (optional)
  orderCode: String?, // Order code for display (optional)
  status: String?, // Order status (optional)
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 **API Endpoints**

### 1. Get Restaurant Notifications
```http
GET /api/v1/notifications/restaurant
GET /api/v1/notifications/restaurant/:restaurantId?limit=5
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notification_id",
      "type": "new_order",
      "title": "Đơn hàng mới",
      "message": "Có đơn hàng mới #ORD001 từ khách hàng Nguyễn Văn A",
      "read": false,
      "priority": "high",
      "orderId": "order_id",
      "orderCode": "ORD001",
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ],
  "unreadCount": 3,
  "total": 15
}
```

### 2. Mark Notification as Read
```http
PATCH /api/v1/notifications/:notificationId/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 3. Mark All Notifications as Read
```http
PATCH /api/v1/notifications/restaurant/read-all
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### 4. Delete Notification
```http
DELETE /api/v1/notifications/:notificationId
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

## 🔌 **Socket.IO Events**

### Server → Client Events

#### 1. New Notification
```javascript
socket.emit('new_notification:v1', {
  notification: {
    id: 'notification_id',
    type: 'new_order',
    title: 'Đơn hàng mới',
    message: 'Có đơn hàng mới #ORD001',
    read: false,
    priority: 'high',
    orderId: 'order_id',
    orderCode: 'ORD001',
    timestamp: '2024-01-01T10:00:00Z'
  }
});
```

#### 2. Notification Update
```javascript
socket.emit('notification_update:v1', {
  notificationId: 'notification_id',
  read: true
});
```

### Client → Server Events

#### 1. Join Restaurant Room
```javascript
socket.emit('join_restaurant_room', {
  restaurantId: 'restaurant_id'
});
```

## 🏗️ **Backend Implementation Guide**

### 1. Create Notification Service
```typescript
// src/notification/notification.service.ts
@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('Notification') private notificationModel: Model<Notification>,
    private notificationGateway: OptimizedNotificationGateway
  ) {}

  async createNotification(data: CreateNotificationDto) {
    const notification = new this.notificationModel({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const saved = await notification.save();
    
    // Emit real-time notification
    this.notificationGateway.notifyRestaurant(
      data.restaurantId, 
      'new_notification:v1', 
      { notification: saved }
    );
    
    return saved;
  }

  async getRestaurantNotifications(restaurantId: string, limit = 20) {
    const notifications = await this.notificationModel
      .find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    const unreadCount = await this.notificationModel
      .countDocuments({ restaurantId, read: false });
    
    return { notifications, unreadCount };
  }

  async markAsRead(notificationId: string) {
    const notification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { read: true, updatedAt: new Date() },
      { new: true }
    );
    
    // Emit update to client
    this.notificationGateway.notifyRestaurant(
      notification.restaurantId,
      'notification_update:v1',
      { notificationId, read: true }
    );
    
    return notification;
  }
}
```

### 2. Create Notification Controller
```typescript
// src/notification/notification.controller.ts
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get('restaurant')
  @UseGuards(JwtAuthGuard)
  async getRestaurantNotifications(@Req() req: any) {
    const restaurantId = req.user.restaurantId;
    return this.notificationService.getRestaurantNotifications(restaurantId);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('restaurant/read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Req() req: any) {
    const restaurantId = req.user.restaurantId;
    return this.notificationService.markAllAsRead(restaurantId);
  }
}
```

### 3. Update Order Service to Create Notifications
```typescript
// src/order/order.service.ts
@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    private notificationService: NotificationService
  ) {}

  async createOrder(orderData: CreateOrderDto) {
    const order = new this.orderModel(orderData);
    const saved = await order.save();
    
    // Create notification for restaurant
    await this.notificationService.createNotification({
      restaurantId: orderData.restaurantId,
      type: 'new_order',
      title: 'Đơn hàng mới',
      message: `Có đơn hàng mới #${saved.orderCode} từ khách hàng ${orderData.customerId.name}`,
      priority: 'high',
      orderId: saved._id,
      orderCode: saved.orderCode,
      read: false
    });
    
    return saved;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    // Create status notification
    await this.notificationService.createNotification({
      restaurantId: order.restaurantId,
      type: 'order_status',
      title: 'Trạng thái đơn hàng thay đổi',
      message: `Đơn hàng #${order.orderCode} đã chuyển sang trạng thái ${status}`,
      priority: 'medium',
      orderId: order._id,
      orderCode: order.orderCode,
      status,
      read: false
    });
    
    return order;
  }
}
```

### 4. Update Socket Gateway
```typescript
// src/notification/optimized-notification.gateway.ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3003' }
})
export class OptimizedNotificationGateway {
  // ... existing code ...

  async notifyRestaurant(restaurantId: string, event: string, payload: any) {
    const room = `restaurant:${restaurantId}`;
    this.server.to(room).emit(event, payload);
    console.log(`📡 Emitted ${event} to room ${room}:`, payload);
  }
}
```

## 🎯 **Integration Steps**

1. **Create Notification Model/Schema**
2. **Implement NotificationService with CRUD operations**
3. **Create NotificationController with REST endpoints**
4. **Update OrderService to create notifications on order events**
5. **Update Socket Gateway to emit notification events**
6. **Test with frontend components**

## 🔧 **Environment Variables**
```env
# Database (Online MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eatnow

# Frontend
FRONTEND_URL=http://localhost:3003

# Backend
PORT=3001
JWT_SECRET=your-jwt-secret
```

## 📝 **Testing**
- Test API endpoints with Postman
- Test Socket.IO events with browser console
- Test real-time notifications with multiple browser tabs
- Test notification persistence and read status
