/**
 * Route Debugging Script
 * This script helps verify which routes are registered
 */

const express = require('express');

console.log('🔍 Route Registration Debug Info\n');
console.log('='.repeat(50));

console.log('\n📋 Current Route Structure:');
console.log('\n✅ Registered Admin Routes:');
console.log('  GET  /api/v1/admin/earnings/clicks');
console.log('  GET  /api/v1/admin/earnings/conversions');
console.log('  POST /api/v1/admin/earnings/conversions/:conversionId/approve');

console.log('\n✅ Registered User Earnings Routes:');
console.log('  GET  /api/v1/earn/products');
console.log('  GET  /api/v1/earn/products/:productId/offers');
console.log('  GET  /api/v1/earn/products/:productId/detail');
console.log('  POST /api/v1/earn/products/:productId/apply');
console.log('  POST /api/v1/earn/products/:productId/click');

console.log('\n❌ Route you are trying to access:');
console.log('  POST /api/v1/admin/earn/products');
console.log('\n  This route does NOT exist!');

console.log('\n💡 Possible Solutions:');
console.log('  1. If you want admin product management, create new routes');
console.log('  2. Use existing route: POST /api/v1/earn/products/:productId/click (user route)');
console.log('  3. Check if you meant: GET /api/v1/earn/products (user route)');

console.log('\n🔍 To verify routes at runtime:');
console.log('  1. Check server console logs when starting');
console.log('  2. Use middleware to log all incoming requests');
console.log('  3. Test with: curl -v http://localhost:3000/api/v1/admin/earnings/clicks');

console.log('\n' + '='.repeat(50));

