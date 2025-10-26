const mongoose = require('mongoose');
const { Cart, CartSchema } = require('./dist/cart/schemas/cart.schema');
const { Item, ItemSchema } = require('./dist/restaurant/schemas/item.schema');

async function testCart() {
  try {
    await mongoose.connect('mongodb://localhost:27017/eatnow');
    console.log('Connected to MongoDB');
    
    // Create models
    const CartModel = mongoose.model('Cart', CartSchema);
    const ItemModel = mongoose.model('Item', ItemSchema);
    
    // Test creating a simple cart
    const testCart = new CartModel({
      userId: new mongoose.Types.ObjectId(),
      restaurantId: new mongoose.Types.ObjectId(),
      status: 'active',
      items: [],
      totalItems: 0,
      totalAmount: 0,
      itemCount: 0
    });
    
    console.log('Test cart created:', testCart);
    
    await testCart.save();
    console.log('✅ Cart saved successfully');
    
    // Clean up
    await CartModel.deleteOne({ _id: testCart._id });
    console.log('✅ Test cart cleaned up');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Test error:', error);
    mongoose.disconnect();
  }
}

testCart();
