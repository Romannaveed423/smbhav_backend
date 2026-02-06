const mongoose = require('mongoose');
require('dotenv').config();

// Import PODCoupon model
const PODCoupon = require('../dist/models/PODCoupon').PODCoupon;

const connectDB = async () => {
  try {
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/sambhav';
    await mongoose.connect(dbUrl);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createSampleCoupons = async () => {
  try {
    await connectDB();

    // Check if coupons already exist
    const existingCoupons = await PODCoupon.find({});
    if (existingCoupons.length > 0) {
      console.log('📋 Existing coupons found:');
      existingCoupons.forEach(coupon => {
        console.log(`   - ${coupon.couponCode}: ${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} off`);
      });
      console.log('\n💡 To create new coupons, delete existing ones first or use different codes.');
      await mongoose.connection.close();
      return;
    }

    // Create sample coupons
    console.log('🎫 Creating sample coupons...\n');

    const coupons = [
      {
        couponCode: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minPurchaseAmount: 500,
        maxDiscountAmount: 200,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        usageLimit: 1000,
        usageCount: 0,
        userUsageLimit: 1,
        isActive: true,
        description: '10% off on orders above ₹500 (max discount ₹200)',
      },
      {
        couponCode: 'FLAT50',
        discountType: 'fixed',
        discountValue: 50,
        minPurchaseAmount: 300,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        usageLimit: 500,
        usageCount: 0,
        userUsageLimit: 2,
        isActive: true,
        description: 'Flat ₹50 off on orders above ₹300',
      },
      {
        couponCode: 'SAVE20',
        discountType: 'percentage',
        discountValue: 20,
        minPurchaseAmount: 1000,
        maxDiscountAmount: 500,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        usageLimit: 200,
        usageCount: 0,
        isActive: true,
        description: '20% off on orders above ₹1000 (max discount ₹500)',
      },
      {
        couponCode: 'FIRST100',
        discountType: 'fixed',
        discountValue: 100,
        minPurchaseAmount: 500,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        usageLimit: 100,
        usageCount: 0,
        userUsageLimit: 1,
        isActive: true,
        description: 'Flat ₹100 off on first order (min ₹500)',
      },
    ];

    const createdCoupons = await PODCoupon.insertMany(coupons);
    
    console.log('✅ Successfully created sample coupons:\n');
    createdCoupons.forEach(coupon => {
      console.log(`   🎟️  ${coupon.couponCode}`);
      console.log(`      ${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} discount`);
      console.log(`      Min purchase: ₹${coupon.minPurchaseAmount || 0}`);
      if (coupon.maxDiscountAmount) {
        console.log(`      Max discount: ₹${coupon.maxDiscountAmount}`);
      }
      console.log(`      Valid until: ${coupon.validUntil.toLocaleDateString()}`);
      console.log(`      Usage limit: ${coupon.usageLimit || 'Unlimited'}`);
      console.log(`      Description: ${coupon.description}\n`);
    });

    console.log('📝 Sample coupon codes you can use:');
    console.log('   - WELCOME10 (10% off, min ₹500)');
    console.log('   - FLAT50 (₹50 off, min ₹300)');
    console.log('   - SAVE20 (20% off, min ₹1000)');
    console.log('   - FIRST100 (₹100 off, min ₹500)\n');

    await mongoose.connection.close();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error creating coupons:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createSampleCoupons();

