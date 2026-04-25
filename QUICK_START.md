# Universal Database Query - Quick Start

## ✅ What's Been Built

### 1. Universal API Endpoint
**File**: `src/app/api/query-database/route.ts`
- Single endpoint that queries ANY collection
- Supports filtering, searching, sorting, and pagination
- Security: tenant isolation + collection whitelist + sensitive field removal

### 2. Helper Utility  
**File**: `src/utils/queryDatabase.ts`
- Easy-to-use functions for querying from your app
- Includes quick query helpers for common patterns

### 3. Complete Documentation
**File**: `N8N_UNIVERSAL_QUERY_SETUP.md`
- Step-by-step n8n configuration guide
- Usage examples for different scenarios
- Troubleshooting tips

---

## 🚀 Quick Test (Before n8n Setup)

Test the endpoint directly in your browser:

```
http://localhost:3000/api/query-database?collection=products&tenantId=YOUR_TENANT_ID&limit=5
```

Or using the helper in your app:
```typescript
import { queryDatabase } from '@/utils/queryDatabase';

const result = await queryDatabase({
  collection: 'services',
  tenantId: 'tenant_abc123',
  filters: { status: 'active' },
  limit: 10
});
```

---

## 📋 n8n Configuration Checklist

### Step 1: Add Tool to AI Agent
- [ ] Open your n8n workflow
- [ ] Find the AI Agent node
- [ ] Add new tool: **QueryDatabase**
- [ ] Configure HTTP Request settings:
  - URL: `http://your-domain.com/api/query-database`
  - Method: POST
  - Headers: `Content-Type: application/json`
  - Body: Use parameters from AI

### Step 2: Update System Prompt
- [ ] Copy the system prompt from `N8N_UNIVERSAL_QUERY_SETUP.md`
- [ ] Paste into AI Agent's instructions/prompt field
- [ ] Customize collection descriptions if needed

### Step 3: Simplify Workflow
- [ ] Remove Switch node (if you had one routing to different tools)
- [ ] Remove separate QueryProducts/QueryServices tools
- [ ] Keep only ONE QueryDatabase tool

### Step 4: Test
- [ ] Send test message: "Show me all products"
- [ ] Check if AI calls QueryDatabase tool
- [ ] Verify response format
- [ ] Test with filters: "Show active services under 5000"

---

## 💡 Example Queries

| User Asks | AI Should Query |
|-----------|----------------|
| "What products do you have?" | `{ collection: "products", limit: 20 }` |
| "Book a massage" | `{ collection: "services", search: "massage" }` |
| "Order status #123" | `{ collection: "orders", search: "123" }` |
| "Find customer Mary" | `{ collection: "customers", search: "Mary" }` |
| "Active suppliers" | `{ collection: "suppliers", filters: { status: "active" } }` |

---

## 🔒 Security Features

✅ Tenant ID required (data isolation)  
✅ Only allowed collections accessible  
✅ Sensitive fields auto-removed  
✅ Result limits prevent data dumps  
✅ Input validation on all parameters  

---

## 📖 Full Documentation

See `N8N_UNIVERSAL_QUERY_SETUP.md` for:
- Detailed n8n configuration steps
- Complete parameter reference
- Advanced usage examples
- Troubleshooting guide

---

## 🎯 Benefits Over Old Approach

| Old Way | New Way |
|---------|---------|
| 5+ separate tools | 1 universal tool |
| Complex Switch routing | AI decides automatically |
| Hard to maintain | Easy to extend |
| Limited flexibility | Query anything |

---

Ready to configure n8n? Follow the step-by-step guide in `N8N_UNIVERSAL_QUERY_SETUP.md`! 🚀
