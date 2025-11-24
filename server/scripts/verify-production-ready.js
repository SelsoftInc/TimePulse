#!/usr/bin/env node
/**
 * Production Readiness Verification Script
 * Checks if Stripe billing integration is ready for production deployment
 */

require('dotenv').config();
const { models, connectDB } = require('../models');

async function verifyProductionReady() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Stripe Billing - Production Readiness Check         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const checks = {
    database: false,
    envVars: false,
    codeChanges: false,
    stripeConfig: false
  };

  // 1. Check Database Schema
  console.log('1️⃣  Checking Database Schema...\n');
  try {
    await connectDB();
    
    const [results] = await models.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name IN (
        'stripe_customer_id',
        'stripe_subscription_id',
        'plan',
        'billing_interval',
        'seat_limit',
        'current_period_end'
      )
      ORDER BY column_name;
    `);

    const requiredColumns = [
      'billing_interval',
      'current_period_end',
      'plan',
      'seat_limit',
      'stripe_customer_id',
      'stripe_subscription_id'
    ];

    const existingColumns = results.map(r => r.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('   ✅ All required columns exist in tenants table');
      checks.database = true;
    } else {
      console.log('   ❌ Missing columns:', missingColumns.join(', '));
      console.log('   📝 Run: server/migrations/add-stripe-billing-fields.sql');
    }
  } catch (error) {
    console.log('   ❌ Database check failed:', error.message);
  }

  // 2. Check Environment Variables
  console.log('\n2️⃣  Checking Environment Variables...\n');
  
  const requiredEnvVars = {
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
    'APP_BASE_URL': process.env.APP_BASE_URL
  };

  let allEnvVarsSet = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      const masked = key === 'STRIPE_SECRET_KEY' || key === 'STRIPE_WEBHOOK_SECRET'
        ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
        : value;
      console.log(`   ✅ ${key}: ${masked}`);
    } else {
      console.log(`   ❌ ${key}: NOT SET`);
      allEnvVarsSet = false;
    }
  }

  if (allEnvVarsSet) {
    checks.envVars = true;
  }

  // 3. Check Stripe Configuration
  console.log('\n3️⃣  Checking Stripe Configuration...\n');
  
  if (process.env.STRIPE_SECRET_KEY) {
    const isTestKey = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
    const isLiveKey = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
    
    if (isLiveKey) {
      console.log('   ✅ Using LIVE Stripe key (production ready)');
      checks.stripeConfig = true;
    } else if (isTestKey) {
      console.log('   ⚠️  Using TEST Stripe key (not production ready)');
      console.log('   📝 Update to live key for production');
    } else {
      console.log('   ❌ Invalid Stripe key format');
    }
  }

  // 4. Check Code Changes
  console.log('\n4️⃣  Checking Code Changes...\n');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'server/routes/billing.js',
    'frontend/src/components/settings/BillingSettings.jsx',
    'frontend/src/components/billing/BillingSuccess.jsx',
    'server/scripts/setup-stripe-products-per-user.js'
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - NOT FOUND`);
      allFilesExist = false;
    }
  }

  if (allFilesExist) {
    checks.codeChanges = true;
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Summary                                              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const allChecks = Object.values(checks).every(v => v);
  
  console.log(`   Database Schema:      ${checks.database ? '✅' : '❌'}`);
  console.log(`   Environment Variables: ${checks.envVars ? '✅' : '❌'}`);
  console.log(`   Stripe Configuration:  ${checks.stripeConfig ? '✅' : '❌'}`);
  console.log(`   Code Changes:         ${checks.codeChanges ? '✅' : '❌'}`);

  console.log('\n' + '═'.repeat(56));
  
  if (allChecks) {
    console.log('✅ PRODUCTION READY!');
    console.log('\nNext Steps:');
    console.log('1. Create Stripe products: node scripts/setup-stripe-products-per-user.js');
    console.log('2. Update Price IDs in server/routes/billing.js');
    console.log('3. Setup webhook: https://dashboard.stripe.com/webhooks');
    console.log('4. Deploy to production');
  } else {
    console.log('❌ NOT PRODUCTION READY');
    console.log('\nPlease fix the issues above before deploying.');
    console.log('See: PRODUCTION_DEPLOYMENT_CHECKLIST.md');
  }
  
  console.log('═'.repeat(56) + '\n');

  process.exit(allChecks ? 0 : 1);
}

verifyProductionReady().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});

