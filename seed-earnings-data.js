const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Product = require('./dist/models/Product').Product;
const Offer = require('./dist/models/Offer').Offer;
const User = require('./dist/models/User').User;
const Application = require('./dist/models/Application').Application;
const Earning = require('./dist/models/Earning').Earning;
const Withdrawal = require('./dist/models/Withdrawal').Withdrawal;

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

    // Get or create test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('Creating test user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 10);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
        password: hashedPassword,
        walletBalance: 1000,
        totalEarnings: 5000,
        referralCode: 'TEST123',
      });
    }
    console.log(`Using user: ${testUser.email} (ID: ${testUser._id})`);

    // Clear existing earnings data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing earnings data...');
    await Product.deleteMany({});
    await Offer.deleteMany({});
    await Application.deleteMany({});
    await Earning.deleteMany({});
    await Withdrawal.deleteMany({});
    console.log('Existing earnings data cleared');

    // 1. Create Products
    console.log('Creating products...');
    const products = await Product.insertMany([
      {
        name: 'Credit Card Application',
        logo: 'https://example.com/logos/credit-card.png',
        icon: 'https://example.com/icons/credit-card.png',
        description: 'Apply for premium credit cards and earn commissions',
        category: 'campaign',
        section: 'sambhav',
        earnUpTo: 5000,
        route: '/earn/credit-card',
        isActive: true,
        isNew: true,
        details: {
          benefits: {
            payoutOpportunity: [
              { number: '₹500', text: 'Per approved application', hasFireEmoji: true },
              { number: '₹1000', text: 'Bonus for 5+ applications', hasFireEmoji: false },
            ],
            customerBenefits: [
              { icon: 'card', text: 'Premium credit cards' },
              { icon: 'reward', text: 'Cashback rewards' },
            ],
          },
          whomToRefer: 'Business owners, professionals, and high-income individuals',
          trainingVideo: 'https://example.com/videos/credit-card-training.mp4',
          how: 'Share application link and guide customers through the process',
        },
        marketing: {
          materials: [
            'https://example.com/materials/credit-card-banner.jpg',
            'https://example.com/materials/credit-card-flyer.pdf',
          ],
          links: [
            'https://example.com/landing/credit-card',
          ],
        },
        training: {
          videos: [
            'https://example.com/training/credit-card-intro.mp4',
            'https://example.com/training/credit-card-advanced.mp4',
          ],
          documents: [
            'https://example.com/docs/credit-card-guide.pdf',
          ],
        },
      },
      {
        name: 'Personal Loan',
        logo: 'https://example.com/logos/personal-loan.png',
        icon: 'https://example.com/icons/personal-loan.png',
        description: 'Help customers get personal loans and earn commissions',
        category: 'campaign',
        section: 'sambhav',
        earnUpTo: 3000,
        route: '/earn/personal-loan',
        isActive: true,
        isNew: false,
        details: {
          benefits: {
            payoutOpportunity: [
              { number: '₹300', text: 'Per approved loan', hasFireEmoji: true },
              { number: '₹500', text: 'Bonus for loans above ₹5L', hasFireEmoji: false },
            ],
            customerBenefits: [
              { icon: 'money', text: 'Quick loan approval' },
              { icon: 'rate', text: 'Competitive interest rates' },
            ],
          },
          whomToRefer: 'Individuals needing quick funds for personal expenses',
          trainingVideo: 'https://example.com/videos/personal-loan-training.mp4',
          how: 'Share loan application link and assist with documentation',
        },
        marketing: {
          materials: [
            'https://example.com/materials/personal-loan-banner.jpg',
          ],
          links: [
            'https://example.com/landing/personal-loan',
          ],
        },
        training: {
          videos: [
            'https://example.com/training/personal-loan-intro.mp4',
          ],
          documents: [
            'https://example.com/docs/personal-loan-guide.pdf',
          ],
        },
      },
      {
        name: 'Home Loan',
        logo: 'https://example.com/logos/home-loan.png',
        icon: 'https://example.com/icons/home-loan.png',
        description: 'Refer home loan applications and earn high commissions',
        category: 'campaign',
        section: 'sambhav',
        earnUpTo: 10000,
        route: '/earn/home-loan',
        isActive: true,
        isNew: true,
        details: {
          benefits: {
            payoutOpportunity: [
              { number: '₹1000', text: 'Per approved application', hasFireEmoji: true },
              { number: '₹5000', text: 'Bonus for loans above ₹50L', hasFireEmoji: true },
            ],
            customerBenefits: [
              { icon: 'home', text: 'Home ownership made easy' },
              { icon: 'tax', text: 'Tax benefits on interest' },
            ],
          },
          whomToRefer: 'First-time home buyers and property investors',
          trainingVideo: 'https://example.com/videos/home-loan-training.mp4',
          how: 'Share application link and provide guidance on documentation',
        },
        marketing: {
          materials: [
            'https://example.com/materials/home-loan-banner.jpg',
            'https://example.com/materials/home-loan-brochure.pdf',
          ],
          links: [
            'https://example.com/landing/home-loan',
          ],
        },
        training: {
          videos: [
            'https://example.com/training/home-loan-intro.mp4',
            'https://example.com/training/home-loan-documentation.mp4',
          ],
          documents: [
            'https://example.com/docs/home-loan-guide.pdf',
            'https://example.com/docs/home-loan-checklist.pdf',
          ],
        },
      },
      {
        name: 'Insurance Policy',
        logo: 'https://example.com/logos/insurance.png',
        icon: 'https://example.com/icons/insurance.png',
        description: 'Sell insurance policies and earn commissions',
        category: 'dsa_mfd_agent',
        section: 'sambhav',
        earnUpTo: 2000,
        route: '/earn/insurance',
        isActive: true,
        isNew: false,
        details: {
          benefits: {
            payoutOpportunity: [
              { number: '₹200', text: 'Per policy sold', hasFireEmoji: false },
              { number: '₹500', text: 'Bonus for 10+ policies', hasFireEmoji: true },
            ],
            customerBenefits: [
              { icon: 'shield', text: 'Life protection' },
              { icon: 'health', text: 'Health coverage' },
            ],
          },
          whomToRefer: 'Families and individuals seeking insurance coverage',
          trainingVideo: 'https://example.com/videos/insurance-training.mp4',
          how: 'Share policy information and assist with enrollment',
        },
        marketing: {
          materials: [
            'https://example.com/materials/insurance-banner.jpg',
          ],
          links: [
            'https://example.com/landing/insurance',
          ],
        },
        training: {
          videos: [
            'https://example.com/training/insurance-intro.mp4',
          ],
          documents: [
            'https://example.com/docs/insurance-guide.pdf',
          ],
        },
      },
    ]);
    console.log(`Created ${products.length} products`);

    // 2. Create Offers for Products
    console.log('Creating offers...');
    const offers = [];
    for (const product of products) {
      const productOffers = await Offer.insertMany([
        {
          productId: product._id,
          name: `${product.name} - Standard Offer`,
          amount: product.earnUpTo * 0.5,
          oldPrice: product.earnUpTo * 0.6,
          icon: product.icon,
          category: product.category,
          status: 'active',
        },
        {
          productId: product._id,
          name: `${product.name} - Premium Offer`,
          amount: product.earnUpTo * 0.8,
          oldPrice: product.earnUpTo,
          icon: product.icon,
          category: product.category,
          status: 'active',
        },
      ]);
      offers.push(...productOffers);
    }
    console.log(`Created ${offers.length} offers`);

    // 3. Create Applications
    console.log('Creating applications...');
    const applications = [];
    for (let i = 0; i < 3; i++) {
      const product = products[i];
      const offer = offers.find(o => o.productId.toString() === product._id.toString());
      const trackingToken = require('crypto').randomBytes(32).toString('hex');
      
      const application = await Application.create({
        userId: testUser._id,
        productId: product._id,
        clientDetails: {
          clientName: `Client ${i + 1}`,
          businessName: `Business ${i + 1}`,
          gstin: `29ABCDE${1000 + i}F1Z5`,
          addressProof: `https://example.com/proofs/proof-${i + 1}.pdf`,
        },
        documents: {
          aadhar: `https://example.com/documents/aadhar-${i + 1}.pdf`,
          pan: `https://example.com/documents/pan-${i + 1}.pdf`,
          addressProof: `https://example.com/documents/address-${i + 1}.pdf`,
        },
        status: i === 0 ? 'approved' : i === 1 ? 'in_review' : 'pending',
        trackingToken,
        timeline: [
          {
            title: 'Application Submitted',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed',
            icon: 'check_circle',
            timestamp: new Date(),
          },
          ...(i === 0 ? [{
            title: 'Application Approved',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed',
            icon: 'check_circle',
            timestamp: new Date(),
          }] : []),
        ],
      });
      applications.push(application);
    }
    console.log(`Created ${applications.length} applications`);

    // 4. Create Earnings
    console.log('Creating earnings...');
    const earnings = [];
    
    // Create earnings for approved application
    if (applications[0]) {
      const approvedApp = applications[0];
      const product = products[0];
      
      const earning = await Earning.create({
        userId: testUser._id,
        productId: product._id,
        applicationId: approvedApp._id,
        offerId: offers.find(o => o.productId.toString() === product._id.toString())?._id,
        amount: product.earnUpTo * 0.5,
        status: 'completed',
        type: 'application_commission',
        earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        creditedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        postbackData: {
          transactionId: 'TXN123456789',
          conversionId: 'CONV987654321',
        },
      });
      earnings.push(earning);
      
      // Update user wallet
      await User.findByIdAndUpdate(testUser._id, {
        $inc: { walletBalance: earning.amount },
      });
    }
    
    // Create pending earning
    if (applications[1]) {
      const pendingApp = applications[1];
      const product = products[1];
      
      const earning = await Earning.create({
        userId: testUser._id,
        productId: product._id,
        applicationId: pendingApp._id,
        amount: product.earnUpTo * 0.5,
        status: 'pending',
        type: 'application_commission',
        earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      });
      earnings.push(earning);
    }
    
    console.log(`Created ${earnings.length} earnings`);

    // 5. Create Withdrawals
    console.log('Creating withdrawals...');
    const withdrawals = await Withdrawal.insertMany([
      {
        userId: testUser._id,
        amount: 500,
        status: 'completed',
        method: 'bank_transfer',
        accountDetails: {
          accountNumber: '1234567890',
          ifsc: 'BANK0001234',
          accountHolderName: 'Test User',
        },
        requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        processedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      },
      {
        userId: testUser._id,
        amount: 1000,
        status: 'pending',
        method: 'bank_transfer',
        accountDetails: {
          accountNumber: '1234567890',
          ifsc: 'BANK0001234',
          accountHolderName: 'Test User',
        },
        requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        userId: testUser._id,
        amount: 300,
        status: 'completed',
        method: 'upi',
        accountDetails: {
          upiId: 'testuser@paytm',
        },
        requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        processedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
    ]);
    console.log(`Created ${withdrawals.length} withdrawals`);

    console.log('\n✅ Earnings seed data created successfully!');
    console.log('\nSummary:');
    console.log(`- Products: ${products.length}`);
    console.log(`- Offers: ${offers.length}`);
    console.log(`- Applications: ${applications.length}`);
    console.log(`- Earnings: ${earnings.length}`);
    console.log(`- Withdrawals: ${withdrawals.length}`);
    console.log(`\nTest User: ${testUser.email}`);
    console.log(`User ID: ${testUser._id}`);
    console.log(`Wallet Balance: ₹${testUser.walletBalance}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

