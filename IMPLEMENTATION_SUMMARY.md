# Universal Query System - Implementation Summary

## ✅ What Has Been Built

### 1. Core API Endpoint
**File**: `src/app/api/query-database/route.ts`
- **Purpose**: Single universal endpoint to query ANY database collection
- **Methods**: POST and GET support
- **Features**:
  - Dynamic collection querying (products, services, customers, orders, etc.)
  - Flexible filtering with field-value pairs
  - Text search across multiple fields
  - Sorting by any field (asc/desc)
  - Result limiting (pagination ready)
  - Tenant isolation (security)
  - Collection whitelist (security)
  - Sensitive field removal (security)

### 2. Helper Utility
**File**: `src/utils/queryDatabase.ts`
- **Purpose**: Easy-to-use TypeScript functions for querying from your app
- **Exports**:
  - `queryDatabase()` - Main query function
  - `quickQueries.getAll()` - Get all items
  - `quickQueries.search()` - Search by text
  - `quickQueries.filter()` - Filter by field
  - `quickQueries.sorted()` - Get sorted results

### 3. Documentation
**Files Created**:
- `N8N_UNIVERSAL_QUERY_SETUP.md` - Complete n8n configuration guide
- `QUICK_START.md` - Quick reference checklist
- `ARCHITECTURE_DIAGRAM.md` - Visual flow diagrams and architecture
- `test-query-endpoint.js` - Automated test script

---

## 📁 Files Created/Modified

### New Files:
```
src/app/api/query-database/route.ts          (188 lines)
src/utils/queryDatabase.ts                    (118 lines)
N8N_UNIVERSAL_QUERY_SETUP.md                  (441 lines)
QUICK_START.md                                (120 lines)
ARCHITECTURE_DIAGRAM.md                       (446 lines)
test-query-endpoint.js                        (118 lines)
IMPLEMENTATION_SUMMARY.md                     (this file)
```

### Existing Files (No Changes Needed):
- The old `/api/query-products` and `/api/query-services` endpoints still exist
- You can keep them or delete them later (no rush)

---

## 🔧 How to Use

### Option 1: From Your Next.js App
```typescript
import { queryDatabase } from '@/utils/queryDatabase';

// Get active products
const result = await queryDatabase({
  collection: 'products',
  tenantId: 'tenant_abc123',
  filters: { status: 'active' },
  limit: 20
});

console.log(result.results); // Array of products
```

### Option 2: Direct API Call
```bash
curl -X POST http://localhost:3000/api/query-database \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "services",
    "tenantId": "tenant_abc123",
    "filters": { "category": "beauty" },
    "search": "massage",
    "limit": 10
  }'
```

### Option 3: From n8n (After Setup)
The AI Agent will automatically call the endpoint when users ask questions about your data.

---

## 🚀 Next Steps: n8n Configuration

### Step 1: Test the Endpoint Locally
1. Start your dev server: `npm run dev`
2. Update `test-query-endpoint.js` with your tenant ID
3. Run: `node test-query-endpoint.js`
4. Verify you get successful responses

### Step 2: Configure n8n
Follow the detailed guide in `N8N_UNIVERSAL_QUERY_SETUP.md`:

1. **Add QueryDatabase Tool** to your AI Agent node
   - Tool name: `QueryDatabase`
   - Type: HTTP Request
   - URL: `http://your-domain.com/api/query-database`
   - Method: POST
   - Body: Pass parameters from AI

2. **Update AI Agent System Prompt**
   - Copy the prompt from the guide
   - Paste into AI Agent instructions
   - Customize collection descriptions

3. **Simplify Workflow**
   - Remove Switch node (if present)
   - Remove separate QueryProducts/QueryServices tools
   - Keep only ONE QueryDatabase tool

### Step 3: Test with Real Messages
Send WhatsApp messages like:
- "Show me all products"
- "What beauty services do you have?"
- "Find customer John"
- "Recent orders"

Verify the AI responds correctly with data from your database.

---

## 🎯 Key Benefits

### Before (Multiple Tools):
```
❌ QueryProducts tool
❌ QueryServices tool  
❌ QueryCustomers tool
❌ QueryOrders tool
❌ Complex Switch routing
❌ Hard to maintain
❌ Duplicate code
```

### After (Universal Query):
```
✅ ONE QueryDatabase tool
✅ Simple linear workflow
✅ AI decides what to query
✅ Easy to extend
✅ Clean architecture
✅ Secure by design
```

---

## 🔒 Security Features

| Feature | Description |
|---------|-------------|
| **Tenant Isolation** | Every query requires `tenantId` - users only see their own data |
| **Collection Whitelist** | Only 11 predefined collections can be queried |
| **Sensitive Field Removal** | Passwords, API keys, payment details automatically filtered |
| **Result Limits** | Default 20 items, prevents data dumping |
| **Input Validation** | All inputs validated before query execution |
| **Error Handling** | Graceful error messages, no stack traces exposed |

---

## 📊 Supported Collections

The endpoint can query these collections:

1. **products** - Product catalog (name, price, stock, category, etc.)
2. **services** - Service offerings (name, price, duration, category, etc.)
3. **customers** - Customer database (name, phone, email, totalSpent, etc.)
4. **orders** - Order records (orderNumber, status, total, customerName, etc.)
5. **suppliers** - Supplier information (name, contact, rating, etc.)
6. **shipments** - Shipping/tracking (trackingNumber, status, carrier, etc.)
7. **bookings** - Service bookings (customerName, serviceName, date, etc.)
8. **reviews** - Customer reviews (rating, comment, serviceName/productName)
9. **campaigns** - Marketing campaigns (name, status, sentCount, openRate)
10. **expenses** - Business expenses (category, amount, description, date)
11. **categories** - Product/service categories (name, type, count)

---

## 💡 Usage Examples

### Example 1: Get All Active Products
```json
{
  "collection": "products",
  "tenantId": "tenant_abc123",
  "filters": { "status": "active" },
  "limit": 20
}
```

### Example 2: Search for Services
```json
{
  "collection": "services",
  "tenantId": "tenant_abc123",
  "search": "massage",
  "limit": 10
}
```

### Example 3: Filter + Search Combined
```json
{
  "collection": "products",
  "tenantId": "tenant_abc123",
  "filters": { "category": "electronics", "status": "active" },
  "search": "wireless headphones",
  "sortBy": "price",
  "sortOrder": "asc",
  "limit": 15
}
```

### Example 4: Get Top Customers
```json
{
  "collection": "customers",
  "tenantId": "tenant_abc123",
  "sortBy": "totalSpent",
  "sortOrder": "desc",
  "limit": 10
}
```

---

## 🧪 Testing

### Manual Test (Browser):
```
http://localhost:3000/api/query-database?collection=products&tenantId=YOUR_ID&limit=5
```

### Automated Test:
```bash
# Update TENANT_ID in test-query-endpoint.js first
node test-query-endpoint.js
```

### Expected Output:
```
🧪 Testing Universal Query Endpoint

Test 1: Query Products
Request: { "collection": "products", "tenantId": "...", "limit": 5 }
Response Status: 200
Response: { "success": true, "count": 5, "results": [...] }
✅ Test PASSED
📊 Returned 5 results
```

---

## 🐛 Troubleshooting

### Issue: "Invalid collection" error
**Solution**: Use only allowed collection names (see list above)

### Issue: No results returned
**Solution**: 
- Verify tenantId is correct
- Check if data exists for this tenant
- Try removing filters to see if any data exists

### Issue: CORS errors (if testing from different domain)
**Solution**: Add CORS headers to the API route (currently allows all origins)

### Issue: AI not calling the tool
**Solution**:
- Ensure tool is configured in n8n
- Check system prompt includes clear instructions
- Test with explicit queries first

---

## 📈 Performance

- **Firestore Queries**: Uses indexed fields (tenantId, status, category)
- **Client-side Search**: Reduces complex Firestore queries
- **Result Limits**: Prevents large data transfers
- **Stateless**: No session overhead
- **Scalable**: Can add caching layer if needed

---

## 🔄 Migration Path

You can migrate gradually:

**Phase 1** (Current):
- ✅ Universal endpoint created
- ✅ Old endpoints still work
- Both coexist peacefully

**Phase 2** (Testing):
- Configure n8n with new QueryDatabase tool
- Test thoroughly with real messages
- Verify all use cases work

**Phase 3** (Cleanup - Optional):
- Once confident, delete old endpoints:
  - `/api/query-products/route.ts`
  - `/api/query-services/route.ts`
- Or keep them as fallback (no harm)

---

## 🎓 Learning Resources

- **Full Setup Guide**: `N8N_UNIVERSAL_QUERY_SETUP.md`
- **Quick Reference**: `QUICK_START.md`
- **Architecture Details**: `ARCHITECTURE_DIAGRAM.md`
- **Test Script**: `test-query-endpoint.js`

---

## ✨ Summary

You now have a **powerful, secure, scalable universal query system** that:

1. ✅ Replaces multiple separate tools with ONE universal tool
2. ✅ Lets AI intelligently decide what to query
3. ✅ Simplifies your n8n workflow dramatically
4. ✅ Maintains strong security (tenant isolation, whitelists, field filtering)
5. ✅ Is easy to extend (just add collection name to allowlist)
6. ✅ Works with ALL your existing collections
7. ✅ Includes comprehensive documentation and tests

**Next Action**: Follow the n8n setup guide in `N8N_UNIVERSAL_QUERY_SETUP.md` to configure your AI Agent!

---

Built with ❤️ for WhatsApp Chap Chap
