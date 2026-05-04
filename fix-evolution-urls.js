#!/usr/bin/env node

/**
 * Migration Script: Fix HTTP to HTTPS for Evolution API URLs
 * 
 * This script updates all tenant records in Firestore to use HTTPS
 * instead of HTTP for the Evolution API URL.
 * 
 * Usage: node fix-evolution-urls.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to create this

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixEvolutionUrls() {
  console.log('🔧 Starting Evolution URL migration...\n');
  
  const oldHttpUrl = 'http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io';
  const newHttpsUrl = 'https://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io';
  
  try {
    // Get all tenants
    const tenantsSnapshot = await db.collection('tenants').get();
    
    console.log(`📊 Found ${tenantsSnapshot.size} tenants\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const doc of tenantsSnapshot.docs) {
      const tenant = doc.data();
      const updates = {};
      
      // Check and update evolutionServerUrl
      if (tenant.evolutionServerUrl && tenant.evolutionServerUrl.includes(oldHttpUrl)) {
        updates.evolutionServerUrl = tenant.evolutionServerUrl.replace(oldHttpUrl, newHttpsUrl);
        console.log(`  ✅ Tenant ${doc.id}: evolutionServerUrl updated`);
      }
      
      // Check and update evolutionApiUrl
      if (tenant.evolutionApiUrl && tenant.evolutionApiUrl.includes(oldHttpUrl)) {
        updates.evolutionApiUrl = tenant.evolutionApiUrl.replace(oldHttpUrl, newHttpsUrl);
        console.log(`  ✅ Tenant ${doc.id}: evolutionApiUrl updated`);
      }
      
      // Apply updates if any fields need changing
      if (Object.keys(updates).length > 0) {
        try {
          await db.collection('tenants').doc(doc.id).update(updates);
          updated++;
          console.log(`  💾 Saved updates for tenant ${doc.id}\n`);
        } catch (updateErr) {
          errors++;
          console.error(`   Failed to update tenant ${doc.id}:`, updateErr.message, '\n');
        }
      } else {
        skipped++;
      }
    }
    
    console.log('\n Migration complete!');
    console.log(`   ✅ Updated: ${updated} tenants`);
    console.log(`   ⏭️  Skipped: ${skipped} tenants (no changes needed)`);
    console.log(`   ❌ Errors: ${errors} tenants\n`);
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

// Run the migration
fixEvolutionUrls();
