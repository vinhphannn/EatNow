/*
  Migration: Split legacy global cart line-items into per-restaurant carts

  How to run:
    MONGODB_URI="mongodb://localhost:27017/eatnow" node backend/scripts/migrate-carts-to-restaurant-carts.js

  Notes:
  - Reads legacy 'Cart' items (one document per item) from 'carts' collection
  - Groups by (userId, restaurantId)
  - Creates/Upserts one CartHeader per group and CartItem children with snapshots
  - Recomputes totals per CartHeader
  - Optionally disables/deletes legacy docs (configurable flag)
*/

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/eatnow';
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const SOFT_DELETE_OLD = process.env.SOFT_DELETE_OLD !== '0';

// Legacy Cart schema (line-item per doc)
const oldCartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  quantity: Number,
  specialInstructions: String,
  isActive: { type: Boolean, default: true },
}, { collection: 'carts', timestamps: true });

const itemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imageUrl: String,
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
}, { collection: 'items' });

// New models
const cartHeaderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  status: { type: String, default: 'active', enum: ['active','checked_out','abandoned'] },
  totalItems: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
}, { collection: 'cartheaders', timestamps: true });

const cartItemSchema = new mongoose.Schema({
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'CartHeader', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceSnapshot: { type: Number, required: true },
  itemNameSnapshot: { type: String, required: true },
  imageUrlSnapshot: { type: String },
  optionsSnapshot: { type: Object },
  subtotal: { type: Number, required: true },
}, { collection: 'cartitems', timestamps: true });

async function main() {
  console.log('[Migration] Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI, { autoIndex: false });

  const OldCart = mongoose.model('OldCart', oldCartSchema);
  const Item = mongoose.model('Item', itemSchema);
  const CartHeader = mongoose.model('CartHeader', cartHeaderSchema);
  const CartItem = mongoose.model('CartItem', cartItemSchema);

  console.log('[Migration] Loading legacy cart items...');
  const legacy = await OldCart.find({ isActive: true }).lean();
  console.log(`[Migration] Found ${legacy.length} legacy cart line-items`);

  // Group by userId + restaurantId
  const groups = new Map();
  for (const c of legacy) {
    const key = `${String(c.userId)}::${String(c.restaurantId)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  console.log(`[Migration] Grouped into ${groups.size} carts (user+restaurant)`);

  let headersCreated = 0, itemsCreated = 0;

  for (const [key, docs] of groups.entries()) {
    const [userId, restaurantId] = key.split('::');
    console.log(`\n[Migration] Processing cart for user=${userId}, restaurant=${restaurantId}, items=${docs.length}`);

    // Upsert header
    let header = await CartHeader.findOne({ userId, restaurantId, status: 'active' });
    if (!header) {
      if (!DRY_RUN) header = await CartHeader.create({ userId, restaurantId, status: 'active' });
      headersCreated++;
    }

    // Build items
    let totalItems = 0;
    let totalAmount = 0;
    for (const d of docs) {
      const item = await Item.findById(d.itemId).lean();
      if (!item) {
        console.warn('  - Skipping missing item:', d.itemId);
        continue;
      }
      const qty = Math.max(1, Number(d.quantity || 1));
      const price = Number(item.price || 0);
      const subtotal = price * qty;

      totalItems += qty;
      totalAmount += subtotal;

      if (!DRY_RUN) {
        // Upsert per (cartId, itemId)
        await CartItem.updateOne(
          { cartId: header._id, itemId: item._id },
          {
            $setOnInsert: {
              cartId: header._id,
              itemId: item._id,
              priceSnapshot: price,
              itemNameSnapshot: item.name || 'Món',
              imageUrlSnapshot: item.imageUrl,
              optionsSnapshot: undefined,
            },
            $set: {
              quantity: qty,
              subtotal,
            }
          },
          { upsert: true }
        );
      }
      itemsCreated++;
    }

    if (!DRY_RUN) {
      await CartHeader.updateOne({ _id: header._id }, { $set: { totalItems, totalAmount } });
    }
  }

  if (!DRY_RUN && SOFT_DELETE_OLD) {
    console.log('\n[Migration] Soft-deactivating legacy cart docs...');
    await OldCart.updateMany({ isActive: true }, { $set: { isActive: false } });
  }

  console.log(`\n[Migration] Done. Headers created (or found): ~${headersCreated}, Items upserted: ~${itemsCreated}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});


