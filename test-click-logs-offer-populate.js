/**
 * Test script to verify click logs offer population
 * Run: node test-click-logs-offer-populate.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ClickLogSchema = new mongoose.Schema({
  clickId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', index: true },
  taskUrl: { type: String, required: true },
  redirectUrl: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  referrer: String,
  clickedAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'converted', 'expired', 'rejected'],
    default: 'pending',
    index: true,
  },
  conversionId: { type: String, sparse: true },
  postbackReceived: { type: Boolean, default: false },
  postbackReceivedAt: Date,
}, { timestamps: true });

const ClickLog = mongoose.models.ClickLog || mongoose.model('ClickLog', ClickLogSchema);

async function testClickLogsOffer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sombhav');
    console.log('✅ Connected to MongoDB\n');

    // Get one click log with populate
    const log = await ClickLog.findOne()
      .populate('userId', 'name email phone')
      .populate('offerId', 'name payoutCost payoutType')
      .populate('productId', 'name category')
      .lean();

    if (!log) {
      console.log('❌ No click logs found in database');
      process.exit(1);
    }

    console.log('📊 Click Log Details:');
    console.log('─'.repeat(60));
    console.log(`Click ID: ${log.clickId}`);
    console.log(`Status: ${log.status}`);
    console.log(`Has offerId field: ${log.offerId !== undefined && log.offerId !== null}`);
    console.log(`Offer ID (raw): ${log.offerId?._id || log.offerId || 'null/undefined'}`);
    console.log(`Offer Name: ${log.offerId?.name || 'N/A'}`);
    console.log(`Offer Amount: ${log.offerId?.payoutCost || log.offerId?.amount || 'N/A'}`);
    console.log('─'.repeat(60));
    console.log('\n📋 Full Log Object:');
    console.log(JSON.stringify({
      clickId: log.clickId,
      hasOfferId: !!log.offerId,
      offerIdValue: log.offerId?._id?.toString() || log.offerId || null,
      offer: log.offerId ? {
        id: log.offerId._id?.toString(),
        name: log.offerId.name || 'N/A',
        amount: log.offerId.payoutCost || log.offerId.amount || 0,
      } : null,
      userId: log.userId ? {
        id: log.userId._id?.toString(),
        name: log.userId.name,
        email: log.userId.email,
      } : null,
      productId: log.productId ? {
        id: log.productId._id?.toString(),
        name: log.productId.name,
      } : null,
    }, null, 2));

    // Count click logs with/without offerId
    console.log('\n📊 Database Statistics:');
    console.log('─'.repeat(60));
    const totalLogs = await ClickLog.countDocuments({});
    const logsWithOfferId = await ClickLog.countDocuments({ offerId: { $exists: true, $ne: null } });
    const logsWithoutOfferId = await ClickLog.countDocuments({ offerId: { $exists: false } });
    const logsWithNullOfferId = await ClickLog.countDocuments({ offerId: null });

    console.log(`Total click logs: ${totalLogs}`);
    console.log(`Logs with offerId: ${logsWithOfferId}`);
    console.log(`Logs without offerId field: ${logsWithoutOfferId}`);
    console.log(`Logs with null offerId: ${logsWithNullOfferId}`);

    // Check if offers exist for the offerIds
    if (logsWithOfferId > 0) {
      const { Offer } = await import('./src/models/Offer.js');
      const distinctOfferIds = await ClickLog.distinct('offerId').filter(id => id !== null);
      console.log(`\n🔍 Checking ${distinctOfferIds.length} unique offerIds...`);
      
      let foundOffers = 0;
      let missingOffers = 0;
      
      for (const offerId of distinctOfferIds.slice(0, 10)) { // Check first 10
        const offer = await Offer.findById(offerId);
        if (offer) {
          foundOffers++;
          console.log(`  ✓ Offer ${offerId} exists: ${offer.name}`);
        } else {
          missingOffers++;
          console.log(`  ✗ Offer ${offerId} NOT FOUND in offers collection`);
        }
      }
      
      if (distinctOfferIds.length > 10) {
        console.log(`  ... (checking first 10 of ${distinctOfferIds.length})`);
      }
    }

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testClickLogsOffer();

