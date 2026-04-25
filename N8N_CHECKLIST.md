# n8n Configuration Checklist

Use this checklist to configure your n8n workflow with the Universal Query system.

---

## Pre-Configuration

### ✅ Step 0: Verify Endpoint Works

- [ ] Start your dev server: `npm run dev`
- [ ] Open browser and test:
  ```
  http://localhost:3000/api/query-database?collection=products&tenantId=YOUR_TENANT_ID&limit=3
  ```
- [ ] Verify you get JSON response with products
- [ ] If it works, note your production domain URL (e.g., `https://whatsappchapchap.vercel.app`)

---

## n8n Workflow Configuration

### ✅ Step 1: Open Your n8n Workflow

- [ ] Log in to your n8n instance
- [ ] Open your WhatsApp workflow
- [ ] Make sure you're in **Edit** mode

---

### ✅ Step 2: Locate AI Agent Node

- [ ] Find your existing AI Agent node
- [ ] Click on it to open settings
- [ ] Look for "Tools" or "Functions" section

---

### ✅ Step 3: Add QueryDatabase Tool

#### If using HTTP Request as tool:

- [ ] Click "Add Tool" or "Add Function"
- [ ] Select "HTTP Request" type
- [ ] Configure as follows:

**Tool Name**: 
```
QueryDatabase
```

**Description**:
```
Query any collection in the database. Use this to retrieve information about products, services, customers, orders, or any other business data. Specify which collection to query and optional filters to narrow results.
```

**HTTP Method**: 
```
POST
```

**URL**: 
```
http://YOUR_DOMAIN.com/api/query-database
```
⚠️ Replace `YOUR_DOMAIN.com` with your actual domain!

**Headers**:
```json
{
  "Content-Type": "application/json"
}
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

**Parameters Schema** (if your n8n version supports it):
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
      "description": "Tenant ID for data isolation"
    },
    "filters": {
      "type": "object",
      "description": "Optional field-value pairs to filter results"
    },
    "search": {
      "type": "string",
      "description": "Optional search term"
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
      "description": "Maximum results (default: 20)"
    }
  },
  "required": ["collection", "tenantId"]
}
```

- [ ] Save the tool configuration

---

### ✅ Step 4: Update AI Agent System Prompt

- [ ] In the AI Agent node, find "System Prompt" or "Instructions" field
- [ ] Add or replace with this prompt:

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
→ Query: { collection: "services", tenantId: "...", filters: { category: "beauty" }, limit: 20 }
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

- [ ] Save the AI Agent node

---

### ✅ Step 5: Simplify Workflow (If Needed)

If you currently have multiple tools or a Switch node:

- [ ] Identify old tools: QueryProducts, QueryServices, etc.
- [ ] Remove them one by one
- [ ] If you have a Switch node routing to different agents:
  - [ ] Delete the Switch node
  - [ ] Connect Webhook → Edit Fields → AI Agent directly
  - [ ] Remove duplicate branches

Your workflow should now be:
```
Webhook → Edit Fields → AI Agent → Code → HTTP Request (Evolution API)
```

- [ ] Save the workflow

---

### ✅ Step 6: Ensure Tenant ID is Available

- [ ] Check your "Edit Fields" node
- [ ] Make sure it extracts and passes `tenantId`
- [ ] The tenantId should come from:
  - User's authentication context, OR
  - Phone number lookup, OR
  - Hardcoded for testing

Example Edit Fields output:
```json
{
  "tenantId": "tenant_abc123",
  "userPhone": "254712345678",
  "message": "User's message text"
}
```

- [ ] Save if you made changes

---

## Testing

### ✅ Step 7: Test Basic Query

- [ ] Activate your n8n workflow
- [ ] Send WhatsApp message: "Show me all products"
- [ ] Check n8n execution log
- [ ] Verify AI Agent calls QueryDatabase tool
- [ ] Verify API returns results
- [ ] Verify you get WhatsApp response with product list

---

### ✅ Step 8: Test Filtered Query

- [ ] Send WhatsApp message: "Show active services"
- [ ] Check if AI uses filters parameter
- [ ] Verify only active services returned
- [ ] Check response format

---

### ✅ Step 9: Test Search Query

- [ ] Send WhatsApp message: "Do you have laptops?"
- [ ] Check if AI uses search parameter
- [ ] Verify matching products returned
- [ ] Check response is helpful

---

### ✅ Step 10: Test Different Collections

Try these messages:
- [ ] "Who are my top customers?" (customers collection)
- [ ] "Show recent orders" (orders collection)
- [ ] "List my suppliers" (suppliers collection)
- [ ] "Any pending shipments?" (shipments collection)

Verify each works correctly.

---

## Troubleshooting

### ❌ Issue: AI doesn't call the tool

**Check**:
- [ ] Tool is properly configured in AI Agent
- [ ] System prompt includes clear instructions
- [ ] Tool name matches what AI expects
- [ ] Test with explicit command: "Query the products collection"

---

### ❌ Issue: API returns error

**Check**:
- [ ] URL is correct (including http/https)
- [ ] Domain is accessible from n8n server
- [ ] tenantId is being passed correctly
- [ ] Collection name is valid (check whitelist)
- [ ] Check n8n execution log for error details

---

### ❌ Issue: No results returned

**Check**:
- [ ] Data exists for this tenantId
- [ ] Filters aren't too restrictive
- [ ] Try without filters first
- [ ] Check Firestore directly to verify data

---

### ❌ Issue: Response not sent to WhatsApp

**Check**:
- [ ] Code node formats message correctly
- [ ] HTTP Request node sends to Evolution API
- [ ] Evolution API credentials are valid
- [ ] Check Evolution API logs

---

## Optimization

### ✅ Step 11: Fine-Tune AI Behavior

After testing, you may want to adjust:

- [ ] **Result limits**: Change default from 20 to 10 for faster responses
- [ ] **Sorting**: Add preferred sort fields for each collection
- [ ] **Filters**: Set default filters (e.g., always show "active" items)
- [ ] **Response format**: Customize how AI presents data

Example optimization in system prompt:
```
For product queries, always sort by createdAt desc and limit to 10 results.
For customer queries, prioritize those with high totalSpent.
```

---

### ✅ Step 12: Monitor Performance

- [ ] Check n8n execution times
- [ ] Monitor API response times
- [ ] Watch for rate limiting issues
- [ ] Optimize if queries are slow (>2 seconds)

---

## Success Criteria

You've successfully configured the universal query system when:

✅ AI responds to "Show me products" with actual product data  
✅ AI responds to "Find service X" with matching services  
✅ AI can query any collection without separate tools  
✅ Workflow is simpler than before (fewer nodes)  
✅ Responses are fast (<3 seconds total)  
✅ No errors in n8n execution logs  

---

## Next Steps After Success

Once everything works:

1. **Remove Old Endpoints** (Optional):
   - Delete `/api/query-products/route.ts`
   - Delete `/api/query-services/route.ts`
   - Or keep them as backup

2. **Add More Collections** (If needed):
   - Add collection name to ALLOWED_COLLECTIONS in route.ts
   - Update AI system prompt with new collection info
   - No n8n changes needed!

3. **Advanced Features** (Future):
   - Add pagination support
   - Implement result caching
   - Add aggregation queries (count, sum, avg)
   - Support complex filters (>, <, between)

---

## Need Help?

Refer to:
- 📖 Full guide: `N8N_UNIVERSAL_QUERY_SETUP.md`
- 🏗️ Architecture: `ARCHITECTURE_DIAGRAM.md`
- 🧪 Testing: `test-query-endpoint.js`
- 📋 Quick ref: `QUICK_START.md`

---

**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

Last Updated: _______________
