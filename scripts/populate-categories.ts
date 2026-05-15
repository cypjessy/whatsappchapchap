/**
 * Script to pre-populate categoryNames collection with all 15 categories
 * Run this once to ensure all categories are available even if no products exist yet
 * 
 * Usage: npx ts-node scripts/populate-categories.ts [tenantId]
 */

import admin from 'firebase-admin';
import categoryData from '../src/lib/categoryData';

// Get tenantId from command line argument or use default
const tenantId = process.argv[2] || 'default';
console.log(`📋 Using tenantId: ${tenantId}`);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function populateCategoryNames() {
  console.log('📦 Starting categoryNames population...');
  
  const categories = Object.values(categoryData);
  console.log(`Found ${categories.length} categories to populate`);
  
  for (const category of categories) {
    const docId = `${tenantId}_${category.id}`; // Include tenantId in document ID
    const subcategories = Object.values(category.subcategories).map(sub => sub.name);
    
    try {
      // Check if document already exists
      const docRef = db.collection('categoryNames').doc(docId);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        console.log(`✓ Category "${category.name}" already exists, updating subcategories...`);
        await docRef.update({
          tenantId: tenantId,
          mainCategory: category.id,
          mainCategoryName: category.name,
          icon: category.icon,
          description: category.description,
          subcategories: subcategories,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        console.log(`➕ Creating category "${category.name}"...`);
        await docRef.set({
          id: category.id,
          tenantId: tenantId,
          mainCategory: category.id,
          mainCategoryName: category.name,
          icon: category.icon,
          description: category.description,
          subcategories: subcategories,
          productCount: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      console.log(`  - Subcategories: ${subcategories.length}`);
      console.log(`  - Icon: ${category.icon}`);
    } catch (error) {
      console.error(`❌ Error processing category "${category.name}":`, error);
    }
  }
  
  console.log('\n✅ CategoryNames population complete!');
  console.log(`Total categories: ${categories.length}`);
  console.log(`Tenant ID: ${tenantId}`);
}

// Run the script
populateCategoryNames()
  .then(() => {
    console.log('\n🎉 Done! All categories are now available.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
