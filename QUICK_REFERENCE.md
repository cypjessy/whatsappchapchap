# Universal Query - Quick Reference Card

## API Endpoint
```
POST http://YOUR_DOMAIN.com/api/query-database
```

## Request Format
```json
{
  "collection": "products",           // Required: collection name
  "tenantId": "tenant_abc123",        // Required: your tenant ID
  "filters": {                        // Optional: exact match filters
    "status": "active",
    "category": "electronics"
  },
  "search": "laptop",                 // Optional: text search
  "sortBy": "price",                  // Optional: sort field (default: createdAt)
  "sortOrder": "asc",                 // Optional: asc or desc (default: desc)
  "limit": 20                         // Optional: max results (default: 20)
}
```

## Response Format
```json
{
  "success": true,
  "collection": "products",
  "count": 5,
  "results": [
    { "id": "p1", "name": "Laptop", "price": 150000, ... },
    ...
  ]
}
```

---

## Allowed Collections

| Collection | Use For | Key Fields |
|------------|---------|------------|
| `products` | Product catalog | name, price, stock, category, status |
| `services` | Service offerings | name, price, duration, category, status |
| `customers` | Customer database | name, phone, email, totalSpent |
| `orders` | Order records | orderNumber, status, total, customerName |
| `suppliers` | Supplier info | name, contactPerson, phone, rating |
| `shipments` | Shipping/tracking | trackingNumber, status, carrier |
| `bookings` | Service bookings | customerName, serviceName, date, status |
| `reviews` | Customer reviews | rating, comment, serviceName/productName |
| `campaigns` | Marketing campaigns | name, status, sentCount, openRate |
| `expenses` | Business expenses | category, amount, description, date |
| `categories` | Categories | name, type, count |

---

## Common Query Patterns

### Get All Items
```json
{
  "collection": "products",
  "tenantId": "...",
  "limit": 50
}
```

### Filter by Status
```json
{
  "collection": "services",
  "tenantId": "...",
  "filters": { "status": "active" },
  "limit": 20
}
```

### Search by Text
```json
{
  "collection": "products",
  "tenantId": "...",
  "search": "wireless headphones",
  "limit": 10
}
```

### Filter + Search
```json
{
  "collection": "products",
  "tenantId": "...",
  "filters": { "category": "electronics", "status": "active" },
  "search": "laptop",
  "limit": 15
}
```

### Sort by Field
```json
{
  "collection": "customers",
  "tenantId": "...",
  "sortBy": "totalSpent",
  "sortOrder": "desc",
  "limit": 10
}
```

### Combined Everything
```json
{
  "collection": "services",
  "tenantId": "...",
  "filters": { "category": "beauty", "status": "active" },
  "search": "massage",
  "sortBy": "price",
  "sortOrder": "asc",
  "limit": 10
}
```

---

## n8n Tool Configuration

**Tool Name**: `QueryDatabase`

**URL**: `http://YOUR_DOMAIN.com/api/query-database`

**Method**: POST

**Headers**: 
```
Content-Type: application/json
```

**Body**:
```json
{
  "collection": "{{ $json.collection }}",
  "tenantId": "{{ $json.tenantId }}",
  "filters": {{ $json.filters || {} }},
  "search": "{{ $json.search }}",
  "sortBy": "{{ $json.sortBy || 'createdAt' }}",
  "sortOrder": "{{ $json.sortOrder || 'desc' }}",
  "limit": {{ $json.limit || 20 }}
}
```

---

## AI System Prompt (Key Parts)

```
You have access to QueryDatabase tool.

COLLECTIONS: products, services, customers, orders, suppliers, 
shipments, bookings, reviews, campaigns, expenses, categories

EXAMPLES:
- "Show products" → { collection: "products", limit: 20 }
- "Beauty services" → { collection: "services", filters: { category: "beauty" } }
- "Find John" → { collection: "customers", search: "John" }
- "Recent orders" → { collection: "orders", sortBy: "createdAt", sortOrder: "desc" }

Always include tenantId from context.
Limit results to 10-50 items.
Format responses naturally for WhatsApp.
```

---

## Helper Functions (TypeScript)

```typescript
import { queryDatabase } from '@/utils/queryDatabase';

// Basic query
const result = await queryDatabase({
  collection: 'products',
  tenantId: 'tenant_abc',
  limit: 20
});

// With filters
const result = await queryDatabase({
  collection: 'services',
  tenantId: 'tenant_abc',
  filters: { status: 'active' }
});

// Quick helpers
import { quickQueries } from '@/utils/queryDatabase';

const all = await quickQueries.getAll('products', tenantId);
const found = await quickQueries.search('services', tenantId, 'massage');
const filtered = await quickQueries.filter('orders', tenantId, 'status', 'pending');
const sorted = await quickQueries.sorted('customers', tenantId, 'totalSpent', 'desc');
```

---

## Testing Commands

### Browser Test (GET)
```
http://localhost:3000/api/query-database?collection=products&tenantId=YOUR_ID&limit=5
```

### cURL Test (POST)
```bash
curl -X POST http://localhost:3000/api/query-database \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "products",
    "tenantId": "YOUR_TENANT_ID",
    "limit": 5
  }'
```

### Node.js Test
```bash
# Update TENANT_ID in test file first
node test-query-endpoint.js
```

---

## Security Rules

✅ **Required**: tenantId on every request  
✅ **Whitelist**: Only 11 allowed collections  
✅ **Filtering**: Sensitive fields auto-removed  
✅ **Limits**: Default 20, prevents data dumps  
✅ **Validation**: All inputs checked  

❌ **Blocked**: Unknown collections  
❌ **Blocked**: Missing tenantId  
❌ **Blocked**: Sensitive fields in response  

---

## Error Responses

### Invalid Collection
```json
{
  "error": "Invalid collection. Allowed: products, services, ..."
}
```
Status: 403

### Missing Tenant ID
```json
{
  "error": "tenantId is required for data isolation"
}
```
Status: 400

### Query Failed
```json
{
  "error": "Query failed",
  "message": "Error details here"
}
```
Status: 500

---

## Performance Tips

⚡ Use specific filters to reduce results  
⚡ Set reasonable limits (10-20 for chat)  
⚡ Use search instead of multiple filters when possible  
⚡ Sort by indexed fields (createdAt, status)  
⚡ Cache frequent queries if needed  

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No results | Check tenantId, verify data exists |
| Invalid collection | Use only allowed names |
| Slow queries | Add filters, reduce limit |
| AI not calling tool | Check system prompt, tool config |
| CORS errors | Ensure domain matches |

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/app/api/query-database/route.ts` | API endpoint |
| `src/utils/queryDatabase.ts` | Helper functions |
| `N8N_UNIVERSAL_QUERY_SETUP.md` | Full setup guide |
| `N8N_CHECKLIST.md` | Step-by-step checklist |
| `QUICK_START.md` | Quick start guide |
| `ARCHITECTURE_DIAGRAM.md` | Architecture details |
| `test-query-endpoint.js` | Test script |

---

## Quick Links

- 📖 Full Guide: `N8N_UNIVERSAL_QUERY_SETUP.md`
- ✅ Checklist: `N8N_CHECKLIST.md`
- 🏗️ Architecture: `ARCHITECTURE_DIAGRAM.md`
- 🧪 Test Script: `test-query-endpoint.js`

---

**Print this page and keep it handy!** 📄
