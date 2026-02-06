const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true, strict: false });

const User = mongoose.model('User', userSchema);

async function setUserAsAdmin() {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/sombhav';
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to MongoDB');

    // Get email from command line argument or use default
    const userEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com';

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.error(`❌ User with email "${userEmail}" not found!`);
      console.log('\n💡 Available options:');
      console.log('   1. Run: npm run create-admin (to create a new admin user)');
      console.log('   2. Run: npm run set-admin <email> (to set existing user as admin)');
      process.exit(1);
    }

    // Update user to admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ User "${userEmail}" has been set as admin!`);
    console.log('\n📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user._id}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
setUserAsAdmin();

