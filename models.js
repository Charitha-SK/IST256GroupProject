const mongoose = require('mongoose');
const { Schema } = mongoose;


const AuthorSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  bio: String,
  role: { type: String, default: 'contributor' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });


const ArticleSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  author: { type: Schema.Types.ObjectId, ref: 'Author' },
  category: String,
  tags: [String],
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Published'],
    default: 'Draft'
  }
}, { timestamps: true });
ArticleSchema.index({ title: 'text', description: 'text' });


const EditorialReviewSchema = new Schema({
  article: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'Author' },
  reviewStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    required: true,
    default: 'Pending'
  },
  editorialNotes: { type: String, default: '' },
  reviewedAt: Date
}, { timestamps: true });


const PublicationScheduleSchema = new Schema({
  article: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
  publicationDate: { type: Date, required: true },
  channels: {
    type: [{
      type: String,
      enum: ['Website', 'Email', 'Social Media']
    }],
    default: []
  },
  editorialReview: { type: Schema.Types.ObjectId, ref: 'EditorialReview' },
  status: {
    type: String,
    enum: ['Scheduled', 'Published', 'Cancelled'],
    default: 'Scheduled'
  }
}, { timestamps: true });
PublicationScheduleSchema.index({ publicationDate: 1, status: 1 });


const ProductSchema = new Schema({
  productId: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  category: String,
  unitOfMeasure: String,
  price: { type: Number, required: true, min: 0 }
}, { timestamps: true });


const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  description: String,
  unitOfMeasure: String,
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const CustomerSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  address: String,
  city: String,
  state: String,
  zipCode: String
}, { _id: false });

const ShippingSchema = new Schema({
  method: String,
  instructions: String,
  cost: { type: Number, default: 0, min: 0 }
}, { _id: false });

const OrderSchema = new Schema({
  customer: { type: CustomerSchema, required: true },
  items: { type: [OrderItemSchema], default: [] },
  shipping: ShippingSchema,
  subtotal: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: String,
  orderStatus: {
    type: String,
    enum: ['pending', 'paid', 'fulfilled', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = {
  Author: mongoose.models.Author || mongoose.model('Author', AuthorSchema),
  Article: mongoose.models.Article || mongoose.model('Article', ArticleSchema),
  EditorialReview: mongoose.models.EditorialReview || mongoose.model('EditorialReview', EditorialReviewSchema),
  PublicationSchedule: mongoose.models.PublicationSchedule || mongoose.model('PublicationSchedule', PublicationScheduleSchema),
  Product: mongoose.models.Product || mongoose.model('Product', ProductSchema),
  Order: mongoose.models.Order || mongoose.model('Order', OrderSchema)
};