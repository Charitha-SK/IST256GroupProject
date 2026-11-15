// Routes that save the store data in MongoDB with Mongoose. 
// Products and cart: full crud (create, read, update, delete)
// Shipping, billing, returns: create and read only 

const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Product } = require('./models');

const router = express.Router();
router.use(express.json());

// Cart collection
const cartSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 }
});
const Cart = mongoose.model("Cart", cartSchema);

// Billing collection
const billingSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  customer: {
    fullName: { type: String, required: true },
    email: String,
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  items: [{
    productId: String,
    description: String,
    unitOfMeasure: String,
    price: Number,
    quantity: Number
  }],
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: String,
  status: { type: String, default: "Pending" },
  message: { type: String, default: "Your order is awaiting approval." }
});
const Billing = mongoose.model("Billing", billingSchema);

// Shipping collection 
const shippingSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  fullName: { type: String, required: true },
  address: String,
  city: String,
  state: String,
  zipCode: String,
  method: String,
  instructions: String,
  cost: Number
});
const Shipping = mongoose.model("Shipping", shippingSchema);

// Retturn collection 
const returnSchema = new mongoose.Schema({
  customer: {
    fullName: { type: String, required: true },
    email: { type: String, required: true }
  },
  orderNumber: { type: String, required: true },
  product: {
    productId: { type: String, required: true },
    productName: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 }
  },
  purchaseDate: { type: Date, required: true },
  reason: { type: String, required: true },
  condition: { type: String, required: true },
  details: String,
  preferredResolution: { type: String, required: true }
});
const Return = mongoose.model("Return", returnSchema);

// ---------- products: create, read, update, delete ----------

// CREATE
router.post("/products", async function(req, res) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// READ 
router.get("/products", async function(req, res) {
  try {
    const products = await Product.find();
    res.json({ products: products });
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// UPDATE
router.put("/products/:productId", async function(req, res) {
  try {
    const result = await Product.updateOne(
      { productId: req.params.productId }, req.body);

    if (result.matchedCount === 0) {
      res.sendStatus(404);
    }
    else {
      res.sendStatus(204);
    }
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// DELETE
router.delete("/products/:productId", async function(req, res) {
  try {
    const result = await Product.deleteOne({ productId: req.params.productId });

    if (result.deletedCount === 0) {
      res.sendStatus(404);
    }
    else {
      res.sendStatus(204);
    }
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// ---------- shopping cart: create, read, update, delete ----------

// CREATE
router.post("/cart", async function(req, res) {
  try {
    const product = await Product.findOne({ productId: req.body.productId });
    if (product === null) {
      res.sendStatus(404);
      return;
    }

    let item = await Cart.findOne({ productId: req.body.productId });
    if (item === null) {
      item = await Cart.create({ productId: req.body.productId, quantity: 1 });
    }
    else {
      item.quantity += 1;
      await item.save();
    }
    res.status(201).json(item);
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// READ 
router.get("/cart", async function(req, res) {
  try {
    const cart = await Cart.find();
    res.json({ cart: cart });
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});


// UPDATE
router.put("/cart/:productId", async function(req, res) {
  try {
    const result = await Cart.updateOne(
      { productId: req.params.productId },
      { quantity: req.body.quantity });
    if (result.matchedCount === 0) {
      res.sendStatus(404);
    }
    else {
      res.sendStatus(204);
    }
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// DELETE
router.delete("/cart/:productId", async function(req, res) {
  try {
    const result = await Cart.deleteOne({ productId: req.params.productId });
    if (result.deletedCount === 0) {
      res.sendStatus(404);
    }
    else {
      res.sendStatus(204);
    }
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// ---------- billing and shipping: create and read ----------

// CREATE
router.post("/billing", async function(req, res) {
  try {
    const order = req.body;
    const customer = order.customer || {};
    const shipping = order.shipping || {};
    const orderId = "DD-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    const billing = await Billing.create({
      orderId: orderId,
      customer: customer,
      items: order.items,
      subtotal: order.subtotal,
      total: order.total,
      paymentMethod: order.paymentMethod
    });

    await Shipping.create({
      orderId: orderId,
      fullName: customer.fullName,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      method: shipping.method,
      instructions: shipping.instructions,
      cost: shipping.cost
    });

    setTimeout(async function() {
      if (billing.total > 500) {
        await Billing.updateOne({ orderId: orderId }, {
          status: "Declined",
          message: "Orders over $500.00 need a manual payment review."
        });
      }
      else {
        await Billing.updateOne({ orderId: orderId }, {
          status: "Approved",
          message: "Your payment was approved. Thank you for your order!"
        });
      }
    }, 1500);

    res.status(201).json({
      orderId: orderId,
      status: billing.status,
      message: billing.message
    });
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// READ 
router.get("/billing/:orderId", async function(req, res) {
  try {
    const billing = await Billing.findOne({ orderId: req.params.orderId });
    if (billing === null) {
      res.sendStatus(404);
    }
    else {
      res.json({
        orderId: billing.orderId,
        status: billing.status,
        message: billing.message,
        total: billing.total
      });
    }
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// READ- get all shipping records
router.get("/shipping", async function(req, res) {
  try {
    const shipping = await Shipping.find();
    res.json({ shipping: shipping });
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// ---------- returns: create and read ----------

// CREATE
router.post("/returns", async function(req, res) {
  try {
    const returnRequest = await Return.create(req.body);
    res.status(201).json(returnRequest);
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

// READ
router.get("/returns", async function(req, res) {
  try {
    const returns = await Return.find();
    res.json({ returns: returns });
  }
  catch (ex) {
    res.status(400).send(ex.message);
  }
});

module.exports = router;
