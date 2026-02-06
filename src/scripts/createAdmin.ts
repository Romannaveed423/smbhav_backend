import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateReferralCode } from '../utils/referralCode';
import { USER_ROLES } from '../utils/constants';
import { config } from '../config/env';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@zozo.com' },
        { phoneNumber: '+919999999999' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Updating password...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Update admin with password
      existingAdmin.password = hashedPassword;
      existingAdmin.email = 'admin@zozo.com';
      existingAdmin.name = 'Admin User';
      await existingAdmin.save();
      
      console.log('✅ Admin password updated successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email: admin@zozo.com');
      console.log('🔐 Password: admin123');
      console.log('📱 Phone:', existingAdmin.phoneNumber);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🔐 Login:');
      console.log('   POST /api/auth/login');
      console.log('   Body: { "email": "admin@zozo.com", "password": "admin123" }\n');
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Generate referral code
    const referralCode = await generateReferralCode();

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await User.create({
      phoneNumber: '+919999999999', // Admin phone number
      email: 'admin@zozo.com',
      password: hashedPassword,
      name: 'Admin User',
      role: USER_ROLES.ADMIN,
      referralCode,
      isVerified: true,
      kycStatus: 'verified',
      walletBalance: 0,
      totalEarnings: 0,
      totalLeads: 0,
      totalSales: 0,
      isActive: true,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@zozo.com');
    console.log('🔐 Password: admin123');
    console.log('📱 Phone: +919999999999');
    console.log('👤 Name: Admin User');
    console.log('🔑 Role: admin');
    console.log('🎫 Referral Code:', admin.referralCode);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Login Options:');
    console.log('   Option 1: Email/Password Login');
    console.log('   - POST /api/auth/login');
    console.log('   - Body: { "email": "admin@zozo.com", "password": "admin123" }');
    console.log('\n   Option 2: Phone OTP Login');
    console.log('   - POST /api/auth/send-otp (phone: +919999999999)');
    console.log('   - POST /api/auth/verify-otp\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('   User with this email or phone already exists!');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();

