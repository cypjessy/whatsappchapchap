/**
 * Test Script for Universal Query Endpoint
 * 
 * Run this to verify the /api/query-database endpoint works correctly
 * 
 * Usage: node test-query-endpoint.js
 */

// Configuration - UPDATE THESE VALUES
const BASE_URL = 'http://localhost:3000'; // Change to your domain
const TENANT_ID = 'YOUR_TENANT_ID_HERE';   // Replace with actual tenant ID

async function testQueryEndpoint() {
  console.log('🧪 Testing Universal Query Endpoint\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}\n`);

  const tests = [
    {
      name: 'Test 1: Query Products',
      body: {
        collection: 'products',
        tenantId: TENANT_ID,
        limit: 5
      }
    },
    {
      name: 'Test 2: Query Services with Filter',
      body: {
        collection: 'services',
        tenantId: TENANT_ID,
        filters: { status: 'active' },
        limit: 5
      }
    },
    {
      name: 'Test 3: Query with Search',
      body: {
        collection: 'products',
        tenantId: TENANT_ID,
        search: 'phone',
        limit: 10
      }
    },
    {
      name: 'Test 4: Query Customers Sorted',
      body: {
        collection: 'customers',
        tenantId: TENANT_ID,
        sortBy: 'totalSpent',
        sortOrder: 'desc',
        limit: 10
      }
    },
    {
      name: 'Test 5: Invalid Collection (Should Fail)',
      body: {
        collection: 'users', // Not in whitelist
        tenantId: TENANT_ID,
        limit: 5
      }
    },
    {
      name: 'Test 6: Missing Tenant ID (Should Fail)',
      body: {
        collection: 'products',
        // tenantId missing
        limit: 5
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${test.name}`);
    console.log('='.repeat(60));
    console.log('Request:', JSON.stringify(test.body, null, 2));

    try {
      const response = await fetch(`${BASE_URL}/api/query-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.body)
      });

      const data = await response.json();

      console.log('\nResponse Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log('✅ Test PASSED');
        if (data.results) {
          console.log(`📊 Returned ${data.count} results`);
        }
      } else {
        console.log('❌ Test FAILED (Expected for error tests)');
        console.log('Error:', data.error);
      }

    } catch (error) {
      console.log('❌ Test ERROR:', error.message);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Testing Complete');
  console.log('='.repeat(60));
}

// Run tests
testQueryEndpoint().catch(console.error);
