# Universal Query System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     WHATSAPP USER                            │
│  "Show me beauty services under KES 5000"                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  EVOLUTION API                               │
│  Receives WhatsApp message                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              N8N WEBHOOK NODE                                │
│  Triggers workflow                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            EDIT FIELDS NODE                                  │
│  Extracts:                                                   │
│  - tenantId (from context)                                   │
│  - user phone number                                         │
│  - message text                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              AI AGENT NODE                                   │
│                                                              │
│  Input: "Show me beauty services under KES 5000"            │
│                                                              │
│  AI Thinks:                                                  │
│  - User wants "services" → collection = "services"          │
│  - Looking for "beauty" → filter category = "beauty"        │
│  - Price constraint → will filter results < 5000            │
│  - Need tenantId from context                               │
│                                                              │
│  Calls Tool: QueryDatabase                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         QUERYDATABASE TOOL (HTTP Request)                    │
│                                                              │
│  POST http://your-domain.com/api/query-database             │
│                                                              │
│  Body:                                                       │
│  {                                                           │
│    "collection": "services",                                 │
│    "tenantId": "tenant_abc123",                              │
│    "filters": { "category": "beauty" },                      │
│    "limit": 20                                               │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│     NEXT.JS API ENDPOINT                                     │
│     /api/query-database                                      │
│                                                              │
│  1. Validates inputs                                         │
│  2. Checks collection is allowed                             │
│  3. Builds Firestore query:                                  │
│     - WHERE tenantId == "tenant_abc123"                      │
│     - WHERE category == "beauty"                             │
│     - ORDER BY createdAt DESC                                │
│     - LIMIT 20                                               │
│  4. Executes query                                           │
│  5. Filters client-side for price < 5000                     │
│  6. Removes sensitive fields                                 │
│  7. Returns results                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           FIRESTORE DATABASE                                 │
│                                                              │
│  Collection: services                                        │
│  ┌────────────────────────────────────────────┐             │
│  │ doc1: { name: "Facial", price: 2500, ...} │             │
│  │ doc2: { name: "Massage", price: 3000, ...}│             │
│  │ doc3: { name: "Spa", price: 4500, ...}    │             │
│  │ doc4: { name: "Waxing", price: 1500, ...} │             │
│  └────────────────────────────────────────────┘             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         API RESPONSE                                         │
│                                                              │
│  {                                                           │
│    "success": true,                                          │
│    "collection": "services",                                 │
│    "count": 4,                                               │
│    "results": [                                              │
│      { "id": "svc1", "name": "Facial", "price": 2500 },     │
│      { "id": "svc2", "name": "Massage", "price": 3000 },    │
│      { "id": "svc3", "name": "Spa", "price": 4500 },        │
│      { "id": "svc4", "name": "Waxing", "price": 1500 }      │
│    ]                                                         │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         CODE IN JAVASCRIPT NODE (n8n)                        │
│                                                              │
│  Formats results into WhatsApp-friendly message:             │
│                                                              │
│  "We have 4 beauty services under KES 5000:                 │
│   1. Facial - KES 2,500                                     │
│   2. Massage - KES 3,000                                    │
│   3. Spa Package - KES 4,500                                │
│   4. Waxing - KES 1,500                                     │
│                                                             │
│   Which one would you like to book?"                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         HTTP REQUEST NODE (Evolution API)                    │
│                                                              │
│  Sends formatted message back to user via WhatsApp          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     WHATSAPP USER                            │
│  Receives: "We have 4 beauty services under KES 5000..."    │
└─────────────────────────────────────────────────────────────┘
```

---

## Old vs New Architecture Comparison

### OLD APPROACH (Multiple Tools)

```
User Message
    │
    ▼
Webhook → Edit Fields
    │
    ▼
┌─────────────────────────────────┐
│  Code Node: Detect Intent       │
│  - Contains "product"?          │
│  - Contains "service"?          │
│  - Contains "customer"?         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│      SWITCH NODE                │
│  Routes based on intent         │
└────┬────────┬────────┬──────────┘
     │        │        │
     ▼        ▼        ▼
  ┌──────┐ ┌──────┐ ┌──────┐
  │AI Agt│ │AI Agt│ │AI Agt│
  │Prod  │ │Serv  │ │Cust  │
  └──┬───┘ └──┬───┘ └──┬───┘
     │        │        │
     ▼        ▼        ▼
  Code     Code     Code
   │        │        │
   ▼        ▼        ▼
  HTTP     HTTP     HTTP
   │        │        │
   └────────┴────────┘
            │
            ▼
      Evolution API
```

**Problems:**
- ❌ Complex routing logic
- ❌ Multiple AI agents to maintain
- ❌ Hard to add new collections
- ❌ Duplicate code in each branch
- ❌ Switch node gets bloated

---

### NEW APPROACH (Universal Query)

```
User Message
    │
    ▼
Webhook → Edit Fields
    │
    ▼
┌─────────────────────────────────┐
│      AI AGENT                   │
│  (Single Agent with ONE tool)   │
│                                 │
│  AI decides:                    │
│  - Which collection?            │
│  - What filters?                │
│  - What search terms?           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   QueryDatabase Tool            │
│   (HTTP Request)                │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   /api/query-database           │
│   (Universal Endpoint)          │
└────────────┬────────────────────┘
             │
             ▼
          Firestore
             │
             ▼
          Response
             │
             ▼
       Code Node (Format)
             │
             ▼
      Evolution API
```

**Benefits:**
- ✅ Simple linear flow
- ✅ Single AI agent
- ✅ Easy to extend (just add collection name)
- ✅ No duplicate code
- ✅ AI handles all routing decisions

---

## Security Layers

```
┌─────────────────────────────────────────┐
│         Layer 1: Input Validation       │
│  - Check required fields present        │
│  - Validate collection name             │
│  - Sanitize inputs                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Layer 2: Collection Whitelist      │
│  - Only allow predefined collections    │
│  - Block access to sensitive collections│
│  - Prevent injection attacks            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Layer 3: Tenant Isolation         │
│  - Every query requires tenantId        │
│  - WHERE tenantId == provided_id        │
│  - Users only see their own data        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Layer 4: Sensitive Field Removal    │
│  - Strip passwords, API keys            │
│  - Remove payment details               │
│  - Filter private user data             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        Layer 5: Result Limits           │
│  - Default limit: 20 results            │
│  - Max limit enforced                   │
│  - Prevent data dumping                 │
└─────────────────────────────────────────┘
```

---

## Data Flow Example

### Scenario: User asks "What electronics products do you have?"

```
1. WhatsApp User
   ↓ sends message
   
2. Evolution API
   ↓ receives webhook
   
3. n8n Webhook Node
   ↓ triggers workflow
   
4. Edit Fields Node
   ↓ extracts data
   tenantId: "tenant_xyz789"
   message: "What electronics products do you have?"
   
5. AI Agent Node
   ↓ analyzes intent
   AI thinks: "User wants products, specifically electronics"
   
6. QueryDatabase Tool Call
   ↓ makes HTTP request
   POST /api/query-database
   {
     "collection": "products",
     "tenantId": "tenant_xyz789",
     "filters": { "category": "electronics" },
     "limit": 20
   }
   
7. API Endpoint
   ↓ validates & queries
   - Checks "products" is allowed ✓
   - Builds Firestore query
   - WHERE tenantId == "tenant_xyz789"
   - WHERE category == "electronics"
   - LIMIT 20
   
8. Firestore
   ↓ returns documents
   [
     { id: "p1", name: "Laptop", price: 150000, category: "electronics" },
     { id: "p2", name: "Phone", price: 80000, category: "electronics" },
     { id: "p3", name: "Tablet", price: 45000, category: "electronics" }
   ]
   
9. API Endpoint
   ↓ processes results
   - Removes sensitive fields
   - Formats response
   {
     "success": true,
     "count": 3,
     "results": [...]
   }
   
10. n8n Code Node
    ↓ formats message
    "We have 3 electronics products:
     1. Laptop - KES 150,000
     2. Phone - KES 80,000
     3. Tablet - KES 45,000
     
     Interested in any of these?"
    
11. Evolution API
    ↓ sends WhatsApp message
    
12. WhatsApp User
    ← receives response
```

---

## Key Components

### 1. API Endpoint (`/api/query-database`)
**Responsibilities:**
- Validate inputs
- Enforce security rules
- Build Firestore queries
- Execute queries
- Filter sensitive data
- Return formatted results

**Security Features:**
- Collection whitelist
- Tenant isolation
- Field sanitization
- Rate limiting ready

### 2. AI Agent (n8n)
**Responsibilities:**
- Understand user intent
- Decide which collection to query
- Determine appropriate filters
- Format responses naturally
- Handle follow-up questions

**Intelligence:**
- Maps natural language to database queries
- Learns from conversation context
- Makes smart filtering decisions

### 3. QueryDatabase Tool (n8n)
**Responsibilities:**
- Make HTTP requests to API
- Pass parameters from AI
- Return results to AI
- Handle errors gracefully

**Configuration:**
- Single HTTP request node
- Dynamic body from AI parameters
- Error handling built-in

---

## Performance Considerations

### Optimizations Implemented:
✅ **Firestore Indexes**: Queries use indexed fields (tenantId, status, category)  
✅ **Result Limits**: Default 20 items prevents large transfers  
✅ **Client-side Search**: Reduces complex Firestore queries  
✅ **Field Projection**: Only needed fields returned (future enhancement)  
✅ **Caching Ready**: Can add Redis cache layer if needed  

### Future Enhancements:
- Add pagination support for large datasets
- Implement result caching for frequent queries
- Add field projection to reduce payload size
- Support for aggregation queries (count, sum, avg)

---

## Scalability

This architecture scales because:

1. **Single Endpoint**: One API to maintain, not dozens
2. **AI Intelligence**: AI adapts to new collections automatically
3. **Tenant Isolation**: Each business's data is separate
4. **Stateless Design**: No session state to manage
5. **Horizontal Scaling**: Can add more API instances easily

Adding a new collection? Just:
1. Add collection name to ALLOWED_COLLECTIONS array
2. Update AI system prompt with new collection info
3. Done! No code changes needed in n8n.

---

This universal query system provides a clean, secure, and scalable way to give your AI agent access to all your business data! 🚀
