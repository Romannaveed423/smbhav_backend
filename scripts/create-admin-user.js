const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
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

async function createAdminUser() {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/sombhav';
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to MongoDB');

    // Admin user details
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    let adminPhone = process.env.ADMIN_PHONE || '9876543210';

    // Check if admin user already exists by email
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      // Update existing user to admin
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;
      if (adminPassword && adminPassword !== 'admin123') {
        // Only update password if custom password provided (different from default)
        adminUser.password = adminPassword;
      }
      await adminUser.save();
      console.log(`✅ Updated existing user to admin role: ${adminEmail}`);
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
        console.log(`⚠️  Phone was in use, using ${adminPhone} instead`);
      }

      // Create new admin user
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: 'ADMIN' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      });
      console.log(`✅ Created new admin user: ${adminEmail}`);
    }

    console.log('\n📋 Admin User Details:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Phone: ${adminUser.phone}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser._id}`);
    console.log('\n💡 You can now use this email and password to login as admin.');

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();

