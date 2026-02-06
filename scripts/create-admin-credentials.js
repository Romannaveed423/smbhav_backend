#!/usr/bin/env node

/**
 * Create Admin Credentials Script
 * 
 * This script creates an admin user for the Sambhav dashboard.
 * 
 * Usage:
 *   node scripts/create-admin-credentials.js
 *   ADMIN_EMAIL=admin@sambhav.com ADMIN_PASSWORD=SecurePass123 node scripts/create-admin-credentials.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// User Schema (matches the actual User model)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String },
  profileImage: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
  },
  walletBalance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalWithdrawals: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: mongoose.Schema.Types.ObjectId,
  referralEarnings: { type: Number, default: 0 },
  totalReferrals: { type: Number, default: 0 },
  activeReferrals: { type: Number, default: 0 },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  socialLogin: {
    provider: { type: String, enum: ['google', 'facebook'] },
    socialId: String,
  },
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model('User', userSchema);

async function createAdminCredentials() {
  try {
    console.log('🔐 Creating Admin Credentials for Sambhav Dashboard\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Connect to MongoDB
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/sombhav';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to MongoDB\n');

    // Admin user details (can be customized via environment variables)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sambhav.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'Sambhav Admin';
    let adminPhone = process.env.ADMIN_PHONE || '+919876543210';

    console.log('📋 Admin Configuration:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminName}`);
    console.log(`   Phone: ${adminPhone}`);
    console.log(`   Password: ${adminPassword}\n`);

    // Check if admin user already exists by email
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Updating existing user...\n');
      
      // Update existing user to admin
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;
      adminUser.isPhoneVerified = true;
      adminUser.name = adminName;
      
      // Update password if provided
      if (adminPassword) {
        adminUser.password = adminPassword; // Will be hashed by pre-save hook
      }
      
      await adminUser.save();
      console.log(`✅ Updated existing user to admin role: ${adminEmail}\n`);
    } else {
      // Check if phone number is already in use
      const existingPhoneUser = await User.findOne({ phone: adminPhone });
      
      if (existingPhoneUser) {
        // Use a different phone number
        let newPhone = adminPhone;
        let counter = 1;
        while (await User.findOne({ phone: newPhone })) {
          newPhone = adminPhone.slice(0, -1) + counter;
          counter++;
          if (counter > 9) {
            newPhone = '999999' + counter; // Fallback
          }
        }
        adminPhone = newPhone;
        console.log(`⚠️  Phone was in use, using ${adminPhone} instead\n`);
      }

      // Generate referral code
      const referralCode = 'ADMIN' + Math.random().toString(36).substring(2, 10).toUpperCase();

      // Create new admin user
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        kycStatus: 'verified',
        referralCode: referralCode,
        walletBalance: 0,
        totalEarnings: 0,
      });
      console.log(`✅ Created new admin user: ${adminEmail}\n`);
    }

    // Display credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ADMIN CREDENTIALS CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 Email:    ' + adminEmail);
    console.log('🔐 Password: ' + adminPassword);
    console.log('📱 Phone:    ' + adminUser.phone);
    console.log('👤 Name:     ' + adminUser.name);
    console.log('🔑 Role:     ' + adminUser.role);
    console.log('🆔 User ID:   ' + adminUser._id);
    console.log('🎫 Referral: ' + (adminUser.referralCode || 'N/A'));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Save credentials to file
    const credentials = {
      email: adminEmail,
      password: adminPassword,
      phone: adminUser.phone,
      name: adminUser.name,
      role: adminUser.role,
      userId: adminUser._id.toString(),
      createdAt: new Date().toISOString(),
      loginEndpoint: process.env.API_URL || 'http://72.61.244.223:3000/api/v1/auth/login',
      dashboardUrl: process.env.DASHBOARD_URL || 'http://72.61.244.223:3001/login'
    };

    const credentialsPath = path.join(__dirname, '..', 'ADMIN_CREDENTIALS.json');
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    console.log(`💾 Credentials saved to: ${credentialsPath}\n`);

    // Display login instructions
    console.log('🔐 LOGIN INSTRUCTIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('1. Open your dashboard:');
    console.log(`   ${credentials.dashboardUrl}\n`);
    console.log('2. Enter credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);
    console.log('3. Or use API directly:');
    console.log(`   POST ${credentials.loginEndpoint}`);
    console.log(`   Body: { "email": "${adminEmail}", "password": "${adminPassword}" }\n`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Script completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin credentials:', error.message);
    if (error.code === 11000) {
      console.error('   User with this email or phone already exists!');
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the script
createAdminCredentials();

