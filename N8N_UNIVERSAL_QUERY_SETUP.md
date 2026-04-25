# Universal Database Query - n8n Integration Guide

## Overview

You now have a **single universal query endpoint** that can access ALL your database collections. This replaces the need for multiple separate tools (QueryProducts, QueryServices, etc.).

---

## What Was Built

### 1. API Endpoint
**Location**: `/api/query-database`  
**Methods**: POST and GET  
**Purpose**: Query any collection with flexible filters

### 2. Helper Utility
**Location**: `/src/utils/queryDatabase.ts`  
**Purpose**: Easy-to-use functions for querying from your app

---

## How It Works

### Request Format (POST)
```json
{
  "collection": "services",
  "tenantId": "tenant_abc123",
  "filters": {
    "status": "active",
    "category": "beauty"
  },
  "search": "massage",
  "sortBy": "price",
  "sortOrder": "asc",
  "limit": 10
}
```

### Response Format
```json
{
  "success": true,
  "collection": "services",
  "count": 3,
  "results": [
    {
      "id": "svc1",
      "name": "Facial Treatment",
      "price": 2500,
      "duration": "60 min",
      "category": "beauty",
      "status": "active"
    },
    // ... more results
  ]
}
```

---

## Available Collections

The endpoint can query these collections:
- `products` - Your product catalog
- `services` - Service offerings
- `customers` - Customer database
- `orders` - Order records
- `suppliers` - Supplier information
- `shipments` - Shipping/tracking data
- `bookings` - Service bookings
- `reviews` - Customer reviews
- `campaigns` - Marketing campaigns
- `expenses` - Business expenses
- `categories` - Product/service categories

---

## n8n Setup Instructions

### Step 1: Add QueryDatabase Tool to AI Agent

In your n8n workflow, find your **AI Agent** node and add a new tool:

#### Tool Configuration

**Tool Name**: `QueryDatabase`

**Description**: 
```
Query any collection in the database. Use this to retrieve information about products, services, customers, orders, or any other business data. Specify which collection to query and optional filters to narrow results.
```

**Tool Type**: HTTP Request (or Custom Tool depending on your n8n version)

**Parameters Schema**:
```json
{
  "type": "object",
  "properties": {
    "collection": {
      "type": "string",
      "description": "Collection to query (products, services, customers, orders, suppliers, shipments, bookings, reviews, campaigns, expenses, categories)"
    },
    "tenantId": {
      "type": "string",
      "description": "Tenant ID for data isolation (use from workflow context)"
    },
    "filters": {
      "type": "object",
      "description": "Optional field-value pairs to filter results (e.g., {\"status\": \"active\", \"category\": \"electronics\"})"
    },
    "search": {
      "type": "string",
      "description": "Optional search term to find matching items across text fields"
    },
    "sortBy": {
      "type": "string",
      "description": "Field to sort by (default: createdAt)"
    },
    "sortOrder": {
      "type": "string",
      "enum": ["asc", "desc"],
      "description": "Sort order (default: desc)"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of results to return (default: 20, max: 100)"
    }
  },
  "required": ["collection", "tenantId"]
}
```

**API Endpoint URL**: 
```
http://your-domain.com/api/query-database
```
Replace `your-domain.com` with your actual domain (e.g., `whatsappchapchap.vercel.app` or your custom domain)

**HTTP Method**: POST

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
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

### Step 2: Update AI Agent System Prompt

Add this to your AI Agent's system prompt/instructions:

```
You have access to a powerful database query tool called QueryDatabase.

AVAILABLE COLLECTIONS:
- products: name, price, stock, category, status, description
- services: name, price, duration, category, status, description
- customers: name, phone, email, totalSpent, status
- orders: orderNumber, customerName, status, total, createdAt
- suppliers: name, contactPerson, phone, rating, totalOrders
- shipments: trackingNumber, customerName, status, carrier
- bookings: customerName, serviceName, date, status
- reviews: customerName, rating, comment, serviceName/productName
- campaigns: name, status, sentCount, openRate
- expenses: category, amount, description, date
- categories: name, type, count

HOW TO USE:
When users ask questions about your business data, use the QueryDatabase tool to fetch relevant information.

EXAMPLES:

User: "What products do you have?"
→ Query: { collection: "products", tenantId: "...", limit: 20 }

User: "Show me beauty services under 5000"
→ Query: { collection: "services", tenantId: "...", filters: { category: "beauty" }, search: null, limit: 20 }
Then filter results where price <= 5000

User: "Find customer John"
→ Query: { collection: "customers", tenantId: "...", search: "John", limit: 10 }

User: "Recent orders"
→ Query: { collection: "orders", tenantId: "...", sortBy: "createdAt", sortOrder: "desc", limit: 10 }

User: "Active suppliers"
→ Query: { collection: "suppliers", tenantId: "...", filters: { status: "active" }, limit: 20 }

IMPORTANT:
- Always include tenantId from the workflow context
- Use filters for exact matches (status, category, etc.)
- Use search for text searches across names/descriptions
- Limit results to reasonable numbers (10-50)
- Format responses naturally for WhatsApp messages
```

---

### Step 3: Simplify Your Workflow

Since you now have ONE universal tool, you can simplify your workflow:

**OLD WORKFLOW** (Complex):
```
Webhook → Edit Fields → If (condition) → Switch → 
  ├─ AI Agent (QueryProducts) → Code → HTTP Request
  ├─ AI Agent (QueryServices) → Code → HTTP Request
  └─ AI Agent (QueryCustomers) → Code → HTTP Request
```

**NEW WORKFLOW** (Simple):
```
Webhook → Edit Fields → AI Agent (QueryDatabase) → Code → HTTP Request
```

The AI Agent now handles all routing decisions internally!

---

## Usage Examples

### Example 1: Product Inquiry

**User Message**: "Do you have laptops in stock?"

**AI Calls Tool**:
```json
{
  "collection": "products",
  "tenantId": "tenant_abc123",
  "search": "laptop",
  "filters": { "status": "active" },
  "limit": 10
}
```

**AI Response**: "Yes! We have 5 laptops available: MacBook Pro (KES 180,000), Dell XPS (KES 150,000), HP Pavilion (KES 95,000), Lenovo ThinkPad (KES 120,000), and ASUS ZenBook (KES 110,000). Would you like more details on any of these?"

---

### Example 2: Service Booking

**User Message**: "I want to book a massage service"

**AI Calls Tool**:
```json
{
  "collection": "services",
  "tenantId": "tenant_abc123",
  "search": "massage",
  "filters": { "status": "active" },
  "limit": 10
}
```

**AI Response**: "We offer 3 massage services:
1. Swedish Massage - KES 3,000 (60 minutes)
2. Deep Tissue Massage - KES 4,500 (90 minutes)
3. Hot Stone Massage - KES 5,000 (75 minutes)

Which one would you like to book? Please provide your preferred date and time."

---

### Example 3: Order Status Check

**User Message**: "What's the status of order #ORD-12345?"

**AI Calls Tool**:
```json
{
  "collection": "orders",
  "tenantId": "tenant_abc123",
  "search": "ORD-12345",
  "limit": 5
}
```

**AI Response**: "I found your order #ORD-12345. Status: Shipped 🚚. It was shipped on April 20th and should arrive by April 25th. Tracking number: TRK-98765. You can track it here: [tracking link]"

---

### Example 4: Customer Lookup

**User Message**: "Show me customers who spent over 10000"

**AI Calls Tool**:
```json
{
  "collection": "customers",
  "tenantId": "tenant_abc123",
  "sortBy": "totalSpent",
  "sortOrder": "desc",
  "limit": 50
}
```

**AI Response**: (Filters results client-side) "Here are our top customers by spending:
1. Mary Johnson - KES 45,000 total spent
2. John Smith - KES 32,500 total spent
3. Sarah Williams - KES 28,000 total spent
..."

---

## Security Features

✅ **Tenant Isolation**: Every query requires `tenantId` - users only see their own data  
✅ **Collection Whitelist**: Only predefined collections can be queried  
✅ **Sensitive Field Removal**: Passwords, API keys, payment details are automatically filtered out  
✅ **Result Limits**: Default limit of 20 prevents excessive data retrieval  
✅ **Input Validation**: All inputs are validated before query execution  

---

## Testing the Endpoint

Before configuring n8n, test the endpoint directly:

### Using cURL:
```bash
curl -X POST http://your-domain.com/api/query-database \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "products",
    "tenantId": "YOUR_TENANT_ID",
    "limit": 5
  }'
```

### Using Browser (GET method):
```
http://your-domain.com/api/query-database?collection=products&tenantId=YOUR_TENANT_ID&limit=5
```

---

## Troubleshooting

### Issue: "Invalid collection" error
**Solution**: Make sure you're using one of the allowed collection names (see list above)

### Issue: No results returned
**Solution**: 
- Verify the `tenantId` is correct
- Check if data exists in that collection for this tenant
- Try removing filters to see if any data exists

### Issue: AI not calling the tool
**Solution**: 
- Ensure the tool is properly configured in n8n
- Check the system prompt includes clear instructions
- Test with explicit queries like "Query the products collection"

### Issue: Too many results
**Solution**: Reduce the `limit` parameter (recommended: 10-20 for chat responses)

---

## Advanced Tips

### Tip 1: Combine Filters + Search
```json
{
  "collection": "products",
  "filters": { "category": "electronics", "status": "active" },
  "search": "wireless headphones"
}
```
This finds active electronics products AND searches for "wireless headphones" in text fields.

### Tip 2: Sort by Different Fields
```json
{
  "collection": "products",
  "sortBy": "price",
  "sortOrder": "asc"
}
```
Great for showing cheapest/most expensive items.

### Tip 3: Pagination
For large datasets, use `limit` and make multiple calls:
```json
// First page
{ "limit": 20, "sortBy": "createdAt" }

// Next page (implement offset logic in your code node)
```

---

## Migration from Old Approach

If you were using separate endpoints (`/api/query-products`, `/api/query-services`), you can:

1. **Keep them** as fallbacks (no harm in having both)
2. **Or delete them** once you confirm the universal endpoint works
3. **Update n8n** to use only the universal `QueryDatabase` tool

The universal approach is cleaner and more maintainable long-term!

---

## Next Steps

1. ✅ API endpoint created: `/api/query-database`
2. ✅ Helper utility created: `/src/utils/queryDatabase.ts`
3. ⏳ Configure n8n AI Agent with QueryDatabase tool
4. ⏳ Update AI Agent system prompt
5. ⏳ Simplify workflow (remove Switch node if present)
6. ⏳ Test with various queries
7. ⏳ Remove old separate query endpoints (optional)

---

## Need Help?

If you encounter issues:
1. Check browser console for API errors
2. Verify your domain URL in n8n configuration
3. Ensure tenantId is being passed correctly
4. Test endpoint directly before testing through n8n

The universal query system is now ready to power all your AI-driven database interactions! 🚀
