/**
 * Seed script for Bills & Recharges module.
 * Creates the billservices and billtransactions collections (if missing)
 * and inserts sample BillService documents so the collections are visible in MongoDB.
 *
 * Run after building the project: npm run build && node seed-bills-data.js
 * Or: npx ts-node (if you have a ts-node seed) - this script uses dist/ so run after build.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Use compiled models (run npm run build first)
const BillService = require('./dist/models/BillService').BillService;
const BillTransaction = require('./dist/models/BillTransaction').BillTransaction;
const User = require('./dist/models/User').User;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/sombhav';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected to', MONGODB_URI.replace(/\/\/[^@]+@/, '//***@'));
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedBillsData = async () => {
  try {
    await connectDB();

    // 1. Seed BillService documents (this creates the "billservices" collection)
    console.log('Seeding BillService documents...');
    const existingServices = await BillService.countDocuments();
    if (existingServices > 0) {
      console.log(`Found ${existingServices} existing bill service(s). Skipping insert or add more as needed.`);
    } else {
      await BillService.insertMany([
        {
          name: 'Airtel Prepaid Recharge',
          description: 'Prepaid mobile recharge - Airtel',
          type: 'mobile_recharge',
          providerCode: 'AIRTEL_PREPAID',
          minAmount: 10,
          maxAmount: 10000,
          commissionType: 'percentage',
          commissionValue: 2,
          isActive: true,
        },
        {
          name: 'Jio Prepaid Recharge',
          description: 'Prepaid mobile recharge - Jio',
          type: 'mobile_recharge',
          providerCode: 'JIO_PREPAID',
          minAmount: 10,
          maxAmount: 10000,
          commissionType: 'percentage',
          commissionValue: 2,
          isActive: true,
        },
        {
          name: 'Vi Prepaid Recharge',
          description: 'Prepaid mobile recharge - Vi',
          type: 'mobile_recharge',
          providerCode: 'VI_PREPAID',
          minAmount: 10,
          maxAmount: 10000,
          commissionType: 'percentage',
          commissionValue: 1.5,
          isActive: true,
        },
        {
          name: 'Airtel DTH Recharge',
          description: 'Airtel DTH recharge',
          type: 'dth_recharge',
          providerCode: 'AIRTEL_DTH',
          minAmount: 100,
          maxAmount: 5000,
          commissionType: 'percentage',
          commissionValue: 2,
          isActive: true,
        },
        {
          name: 'Tata Sky DTH Recharge',
          description: 'Tata Sky DTH recharge',
          type: 'dth_recharge',
          providerCode: 'TATA_SKY_DTH',
          minAmount: 100,
          maxAmount: 5000,
          commissionType: 'flat',
          commissionValue: 5,
          isActive: true,
        },
        {
          name: 'State Electricity Board',
          description: 'Pay electricity bill',
          type: 'electricity_bill',
          providerCode: 'STATE_ELECTRICITY',
          minAmount: 100,
          maxAmount: 100000,
          commissionType: 'percentage',
          commissionValue: 1,
          isActive: true,
        },
        {
          name: 'Gas Bill Payment',
          description: 'Pay gas utility bill',
          type: 'gas_bill',
          providerCode: 'GAS_BILL',
          minAmount: 100,
          maxAmount: 50000,
          commissionType: 'flat',
          commissionValue: 10,
          isActive: true,
        },
        {
          name: 'Water Bill Payment',
          description: 'Pay water utility bill',
          type: 'water_bill',
          providerCode: 'WATER_BILL',
          minAmount: 50,
          maxAmount: 25000,
          commissionType: 'percentage',
          commissionValue: 0.5,
          isActive: true,
        },
      ]);
      console.log('Inserted 8 BillService documents.');
    }

    // 2. Optionally create one sample BillTransaction (creates "billtransactions" collection)
    const service = await BillService.findOne({ type: 'mobile_recharge' });
    if (!service) {
      console.log('No bill service found, skipping sample transaction.');
    } else {
      const user = await User.findOne();
      if (user) {
        const existingTx = await BillTransaction.findOne({ userId: user._id });
        if (!existingTx) {
          await BillTransaction.create({
            userId: user._id,
            serviceId: service._id,
            serviceType: service.type,
            serviceName: service.name,
            providerCode: service.providerCode,
            accountNumber: '9876543210',
            amount: 199,
            commissionAmount: 3.98,
            status: 'success',
            providerTransactionId: 'SEED_TXN_' + Date.now(),
          });
          console.log('Inserted 1 sample BillTransaction.');
        } else {
          console.log('Sample BillTransaction already exists.');
        }
      } else {
        console.log('No user found in DB. BillTransaction collection will be created when first payment is made via API.');
      }
    }

    const serviceCount = await BillService.countDocuments();
    const txCount = await BillTransaction.countDocuments();
    console.log('\nDone. Collections in your Sambhav database:');
    console.log('  - billservices:', serviceCount, 'document(s)');
    console.log('  - billtransactions:', txCount, 'document(s)');
    console.log('\nIn MongoDB Compass/Studio, look for collections named: billservices, billtransactions');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

seedBillsData();
