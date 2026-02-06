const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const StoreCategory = require('./dist/models/StoreCategory').StoreCategory;
const Store = require('./dist/models/Store').Store;
const StoreProduct = require('./dist/models/StoreProduct').StoreProduct;
const Banner = require('./dist/models/Banner').Banner;
const User = require('./dist/models/User').User;
const Location = require('./dist/models/Location').Location;

const connectDB = async () => {
  try {
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/sombhav';
    await mongoose.connect(dbUrl);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await StoreCategory.deleteMany({});
    await Store.deleteMany({});
    await StoreProduct.deleteMany({});
    await Banner.deleteMany({});
    console.log('Existing data cleared');

    // 1. Create Categories
    console.log('Creating categories...');
    const categories = await StoreCategory.insertMany([
      {
        name: 'Fruits & Vegetables',
        icon: 'https://example.com/icons/fruits.png',
        image: 'https://example.com/images/fruits.jpg',
        backgroundColor: '#FF6B6B',
        productCount: 0,
        order: 1,
        isActive: true,
      },
      {
        name: 'Dairy & Eggs',
        icon: 'https://example.com/icons/dairy.png',
        image: 'https://example.com/images/dairy.jpg',
        backgroundColor: '#4ECDC4',
        productCount: 0,
        order: 2,
        isActive: true,
      },
      {
        name: 'Bakery',
        icon: 'https://example.com/icons/bakery.png',
        image: 'https://example.com/images/bakery.jpg',
        backgroundColor: '#FFE66D',
        productCount: 0,
        order: 3,
        isActive: true,
      },
      {
        name: 'Beverages',
        icon: 'https://example.com/icons/beverages.png',
        image: 'https://example.com/images/beverages.jpg',
        backgroundColor: '#95E1D3',
        productCount: 0,
        order: 4,
        isActive: true,
      },
      {
        name: 'Snacks',
        icon: 'https://example.com/icons/snacks.png',
        image: 'https://example.com/images/snacks.jpg',
        backgroundColor: '#F38181',
        productCount: 0,
        order: 5,
        isActive: true,
      },
    ]);
    console.log(`Created ${categories.length} categories`);

    // 2. Create Stores
    console.log('Creating stores...');
    const stores = await Store.insertMany([
      {
        name: 'Fresh Groceries',
        description: 'Fresh fruits, vegetables, and organic produce',
        status: 'open',
        backgroundColor: '#FF6B6B',
        icon: 'https://example.com/icons/store1.png',
        iconColor: '#FFFFFF',
        leftImage: 'https://example.com/images/store1.jpg',
        rating: 4.5,
        reviews: 120,
        location: {
          address: '123 Main Street, City Center',
          latitude: 40.7128,
          longitude: -74.0060,
        },
        deliveryTime: '30-45 mins',
        deliveryFee: 50,
        minOrder: 200,
        images: [
          'https://example.com/images/store1-1.jpg',
          'https://example.com/images/store1-2.jpg',
        ],
        categories: ['Fruits & Vegetables', 'Dairy & Eggs'],
        openingHours: {
          monday: { open: '08:00', close: '22:00' },
          tuesday: { open: '08:00', close: '22:00' },
          wednesday: { open: '08:00', close: '22:00' },
          thursday: { open: '08:00', close: '22:00' },
          friday: { open: '08:00', close: '22:00' },
          saturday: { open: '09:00', close: '23:00' },
          sunday: { open: '10:00', close: '21:00' },
        },
        isActive: true,
      },
      {
        name: 'Bakery Delight',
        description: 'Fresh baked goods, breads, and pastries',
        status: 'open',
        backgroundColor: '#FFE66D',
        icon: 'https://example.com/icons/store2.png',
        iconColor: '#000000',
        leftImage: 'https://example.com/images/store2.jpg',
        rating: 4.8,
        reviews: 85,
        location: {
          address: '456 Oak Avenue, Downtown',
          latitude: 40.7589,
          longitude: -73.9851,
        },
        deliveryTime: '20-30 mins',
        deliveryFee: 40,
        minOrder: 150,
        images: [
          'https://example.com/images/store2-1.jpg',
          'https://example.com/images/store2-2.jpg',
        ],
        categories: ['Bakery', 'Beverages'],
        openingHours: {
          monday: { open: '07:00', close: '20:00' },
          tuesday: { open: '07:00', close: '20:00' },
          wednesday: { open: '07:00', close: '20:00' },
          thursday: { open: '07:00', close: '20:00' },
          friday: { open: '07:00', close: '21:00' },
          saturday: { open: '08:00', close: '21:00' },
          sunday: { open: '08:00', close: '19:00' },
        },
        isActive: true,
      },
      {
        name: 'Quick Mart',
        description: 'Convenience store with snacks and beverages',
        status: 'open',
        backgroundColor: '#95E1D3',
        icon: 'https://example.com/icons/store3.png',
        iconColor: '#FFFFFF',
        leftImage: 'https://example.com/images/store3.jpg',
        rating: 4.2,
        reviews: 200,
        location: {
          address: '789 Pine Street, Uptown',
          latitude: 40.7505,
          longitude: -73.9934,
        },
        deliveryTime: '15-25 mins',
        deliveryFee: 30,
        minOrder: 100,
        images: [
          'https://example.com/images/store3-1.jpg',
        ],
        categories: ['Snacks', 'Beverages'],
        openingHours: {
          monday: { open: '06:00', close: '24:00' },
          tuesday: { open: '06:00', close: '24:00' },
          wednesday: { open: '06:00', close: '24:00' },
          thursday: { open: '06:00', close: '24:00' },
          friday: { open: '06:00', close: '24:00' },
          saturday: { open: '06:00', close: '24:00' },
          sunday: { open: '06:00', close: '24:00' },
        },
        isActive: true,
      },
    ]);
    console.log(`Created ${stores.length} stores`);

    // 3. Create Products
    console.log('Creating products...');
    const fruitsCategory = categories.find(c => c.name === 'Fruits & Vegetables');
    const dairyCategory = categories.find(c => c.name === 'Dairy & Eggs');
    const bakeryCategory = categories.find(c => c.name === 'Bakery');
    const beveragesCategory = categories.find(c => c.name === 'Beverages');
    const snacksCategory = categories.find(c => c.name === 'Snacks');

    const store1 = stores[0];
    const store2 = stores[1];
    const store3 = stores[2];

    const products = await StoreProduct.insertMany([
      // Store 1 - Fresh Groceries
      {
        name: 'Organic Apples',
        description: 'Fresh organic red apples, 1kg pack',
        price: 160,
        originalPrice: 200,
        discountPercent: 20,
        image: 'https://example.com/images/apple.jpg',
        images: [
          'https://example.com/images/apple-1.jpg',
          'https://example.com/images/apple-2.jpg',
        ],
        category: fruitsCategory._id,
        rating: 4.8,
        reviews: 45,
        stock: 50,
        quantityType: 'Kg',
        storeId: store1._id,
        specifications: {
          weight: '1kg',
          origin: 'Himachal Pradesh',
          organic: true,
        },
        isActive: true,
        isSpecialOffer: true,
        isHighlight: true,
      },
      {
        name: 'Fresh Tomatoes',
        description: 'Fresh red tomatoes, 500g pack',
        price: 40,
        originalPrice: 50,
        discountPercent: 20,
        image: 'https://example.com/images/tomato.jpg',
        category: fruitsCategory._id,
        rating: 4.5,
        reviews: 30,
        stock: 100,
        quantityType: 'Pack',
        storeId: store1._id,
        isActive: true,
        isSpecialOffer: true,
      },
      {
        name: 'Fresh Milk',
        description: 'Pure cow milk, 1 liter',
        price: 60,
        originalPrice: 60,
        discountPercent: 0,
        image: 'https://example.com/images/milk.jpg',
        category: dairyCategory._id,
        rating: 4.7,
        reviews: 120,
        stock: 200,
        quantityType: 'Liter',
        storeId: store1._id,
        isActive: true,
        isHighlight: true,
      },
      // Store 2 - Bakery Delight
      {
        name: 'Fresh Bread',
        description: 'Freshly baked white bread, 400g',
        price: 35,
        originalPrice: 40,
        discountPercent: 12.5,
        image: 'https://example.com/images/bread.jpg',
        category: bakeryCategory._id,
        rating: 4.6,
        reviews: 80,
        stock: 75,
        quantityType: 'Pcs',
        storeId: store2._id,
        isActive: true,
        isSpecialOffer: true,
      },
      {
        name: 'Chocolate Cake',
        description: 'Delicious chocolate cake, 500g',
        price: 250,
        originalPrice: 300,
        discountPercent: 16.67,
        image: 'https://example.com/images/cake.jpg',
        category: bakeryCategory._id,
        rating: 4.9,
        reviews: 150,
        stock: 20,
        quantityType: 'Pcs',
        storeId: store2._id,
        isActive: true,
        isSpecialOffer: true,
        isHighlight: true,
      },
      // Store 3 - Quick Mart
      {
        name: 'Coca Cola',
        description: 'Cold drink, 750ml',
        price: 40,
        originalPrice: 45,
        discountPercent: 11.11,
        image: 'https://example.com/images/coke.jpg',
        category: beveragesCategory._id,
        rating: 4.4,
        reviews: 200,
        stock: 500,
        quantityType: 'Pcs',
        storeId: store3._id,
        isActive: true,
        isSpecialOffer: true,
      },
      {
        name: 'Potato Chips',
        description: 'Crispy potato chips, 150g',
        price: 30,
        originalPrice: 35,
        discountPercent: 14.29,
        image: 'https://example.com/images/chips.jpg',
        category: snacksCategory._id,
        rating: 4.3,
        reviews: 180,
        stock: 300,
        quantityType: 'Pcs',
        storeId: store3._id,
        isActive: true,
        isSpecialOffer: true,
      },
    ]);
    console.log(`Created ${products.length} products`);

    // Update category product counts
    for (const category of categories) {
      const count = await StoreProduct.countDocuments({ category: category._id, isActive: true });
      await StoreCategory.findByIdAndUpdate(category._id, { productCount: count });
    }

    // 4. Create Banners
    console.log('Creating banners...');
    await Banner.insertMany([
      {
        title: 'Special Offer - 20% Off',
        description: 'Get 20% off on all fruits and vegetables',
        image: 'https://example.com/images/banner1.jpg',
        link: '/store/products/special-offers',
        linkType: 'url',
        order: 1,
        isActive: true,
      },
      {
        title: 'New Store Opening',
        description: 'Check out our new bakery store',
        image: 'https://example.com/images/banner2.jpg',
        link: store2._id.toString(),
        linkType: 'store',
        order: 2,
        isActive: true,
      },
      {
        title: 'Fresh Daily',
        description: 'Fresh produce delivered daily',
        image: 'https://example.com/images/banner3.jpg',
        link: products[0]._id.toString(),
        linkType: 'product',
        order: 3,
        isActive: true,
      },
    ]);
    console.log('Created 3 banners');

    console.log('\n✅ Seed data created successfully!');
    console.log('\nSummary:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Stores: ${stores.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Banners: 3`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

