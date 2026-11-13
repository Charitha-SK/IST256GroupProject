const mongoose = require('mongoose');
const {
  Author, Article, EditorialReview, PublicationSchedule, Product, Order
} = require('./models');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/daily_digest';

const products = [
  {
    "productId": "DD-001",
    "description": "Campus Tech Fair Recap",
    "category": "Technology",
    "unitOfMeasure": "Digital",
    "price": 1.99
  },
  {
    "productId": "DD-002",
    "description": "Quiet Hours Photo Essay",
    "category": "Lifestyle",
    "unitOfMeasure": "Digital",
    "price": 2.49
  },
  {
    "productId": "DD-003",
    "description": "Five-Minute Reset",
    "category": "Lifestyle",
    "unitOfMeasure": "Digital",
    "price": 0.99
  },
  {
    "productId": "DD-004",
    "description": "Student Budget Meal Guide",
    "category": "Lifestyle",
    "unitOfMeasure": "Digital",
    "price": 1.49
  },
  {
    "productId": "DD-005",
    "description": "Best Reads of the Semester",
    "category": "Books",
    "unitOfMeasure": "Digital",
    "price": 1.79
  },
  {
    "productId": "DD-006",
    "description": "Daily Digest Reading List Set",
    "category": "Books",
    "unitOfMeasure": "Set",
    "price": 12.99
  },
  {
    "productId": "DD-007",
    "description": "Daily Digest Tote Bag",
    "category": "Accessories",
    "unitOfMeasure": "Each",
    "price": 14.99
  },
  {
    "productId": "DD-008",
    "description": "Dorm Room Refresh Guide",
    "category": "Home",
    "unitOfMeasure": "Digital",
    "price": 2.29
  },
  {
    "productId": "DD-009",
    "description": "Daily Digest Monthly Pass",
    "category": "Lifestyle",
    "unitOfMeasure": "Subscription",
    "price": 7.99
  },
  {
    "productId": "DD-010",
    "description": "Study Gadgets Roundup",
    "category": "Technology",
    "unitOfMeasure": "Digital",
    "price": 1.99
  }
];

const billingOrder = {
  "customer": {
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "address": "123 College Ave",
    "city": "State College",
    "state": "PA",
    "zipCode": "16801"
  },
  "items": [
    {
      "productId": "DD-001",
      "description": "Campus Tech Fair Recap",
      "unitOfMeasure": "Digital",
      "price": 1.99,
      "quantity": 2
    },
    {
      "productId": "DD-002",
      "description": "Quiet Hours Photo Essay",
      "unitOfMeasure": "Digital",
      "price": 2.49,
      "quantity": 1
    }
  ],
  "shipping": {
    "method": "Digital",
    "instructions": "",
    "cost": 0
  },
  "subtotal": 6.47,
  "total": 6.47,
  "paymentMethod": "card"
};


const publicationFormSample = {
  articleTitle: 'Campus Tech Fair Recap',
  articleDescription: 'A recap of the latest campus technology fair.',
  publicationDate: '2026-12-01',
  channels: ['Website', 'Email', 'Social Media'],
  reviewStatus: 'Pending',
  editorialNotes: 'Please verify event details before publication.'
};

async function createDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to database: ${mongoose.connection.name}`);

    
    for (const product of products) {
      await Product.updateOne(
        { productId: product.productId },
        { $set: product },
        { upsert: true, runValidators: true }
      );
    }

    
    await Order.findOneAndUpdate(
      { 'customer.email': billingOrder.customer.email, total: billingOrder.total },
      { $set: billingOrder },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    
    const author = await Author.findOneAndUpdate(
      { email: 'editor@example.com' },
      { $set: {
        fullName: 'Daily Digest Editor',
        email: 'editor@example.com',
        bio: 'Sample editorial account',
        role: 'editor',
        isActive: true
      }},
      { upsert: true, new: true, runValidators: true }
    );

    
    const article = await Article.findOneAndUpdate(
      { title: publicationFormSample.articleTitle },
      { $set: {
        title: publicationFormSample.articleTitle,
        description: publicationFormSample.articleDescription,
        author: author._id,
        status: publicationFormSample.reviewStatus
      }},
      { upsert: true, new: true, runValidators: true }
    );

    
    const review = await EditorialReview.findOneAndUpdate(
      { article: article._id },
      { $set: {
        article: article._id,
        reviewer: author._id,
        reviewStatus: publicationFormSample.reviewStatus,
        editorialNotes: publicationFormSample.editorialNotes,
        reviewedAt: publicationFormSample.reviewStatus === 'Pending' ? undefined : new Date()
      }},
      { upsert: true, new: true, runValidators: true }
    );

    
    await PublicationSchedule.findOneAndUpdate(
      { article: article._id, publicationDate: new Date(publicationFormSample.publicationDate) },
      { $set: {
        article: article._id,
        publicationDate: new Date(publicationFormSample.publicationDate),
        channels: publicationFormSample.channels,
        editorialReview: review._id,
        status: 'Scheduled'
      }},
      { upsert: true, new: true, runValidators: true }
    );

    
    const collectionNames = [
      'authors', 'articles', 'editorialreviews',
      'publicationschedules', 'products', 'orders'
    ];
    for (const name of collectionNames) {
      const exists = await mongoose.connection.db.listCollections({ name }).hasNext();
      if (!exists) await mongoose.connection.createCollection(name);
    }

    console.log('Database created/updated successfully.');
    console.log(`Products imported: ${products.length}`);
    console.log('Billing orders imported: 1');
    console.log('Sample article, editorial review, and publication schedule created.');
  } catch (error) {
    console.error('Database creation failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createDatabase();