import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Define allowed collections to prevent unauthorized access
const ALLOWED_COLLECTIONS = [
  'products',
  'services', 
  'customers',
  'orders',
  'suppliers',
  'shipments',
  'bookings',
  'reviews',
  'campaigns',
  'expenses',
  'categories',
  'businessProfiles',
  'whatsappSettings',
  'shippingMethods'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = request.headers;
    
    // Get tenantId from body or header (for AI tool compatibility)
    const tenantId = body.tenantId || headers.get('x-tenant-id');
    
    const { 
      collection: collectionName, 
      filters = {}, 
      search = '', 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit: limitRaw = 20 
    } = body;

    // Ensure limit is a valid number (n8n may send wrong type)
    const limit = parseInt(String(limitRaw), 10) || 20;

    // Validate inputs
    if (!collectionName) {
      return NextResponse.json(
        { error: 'Collection name is required' }, 
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required for data isolation' }, 
        { status: 400 }
      );
    }

    // Security: Only allow predefined collections
    if (!ALLOWED_COLLECTIONS.includes(collectionName)) {
      return NextResponse.json(
        { error: `Invalid collection. Allowed: ${ALLOWED_COLLECTIONS.join(', ')}` }, 
        { status: 403 }
      );
    }

    // Build query using Admin SDK
    let q = adminDb.collection(collectionName).where('tenantId', '==', tenantId);

    // Apply additional filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        q = q.where(field, '==', value);
      }
    });

    // Apply sorting (disabled - causes Firestore composite index issues)
    // try {
    //   q = q.orderBy(sortBy, sortOrder);
    // } catch (error) {
    //   console.warn(`Sorting by ${sortBy} failed, using default order`);
    // }

    // Apply limit
    q = q.limit(limit);

    // Execute query
    const snapshot = await q.get();
    let results = snapshot.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Apply client-side search if provided
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      results = results.filter((item: any) => {
        // Search across common text fields
        const searchableFields = [
          item.name,
          item.title,
          item.description,
          item.customerName,
          item.productName,
          item.serviceName,
          item.trackingNumber,
          item.orderNumber
        ].filter(Boolean);

        return searchableFields.some(field => 
          String(field).toLowerCase().includes(searchTerm)
        );
      });
    }

    // Remove sensitive fields before returning
    results = results.map((item: any) => {
      const { 
        userId, 
        password, 
        apiKey, 
        secretKey,
        paymentDetails,
        ...safeItem 
      } = item;
      return safeItem;
    });

    return NextResponse.json({
      success: true,
      collection: collectionName,
      count: results.length,
      results: results
    });

  } catch (error: any) {
    console.error('Error in universal query:', error);
    return NextResponse.json(
      { 
        error: 'Query failed', 
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const collectionName = searchParams.get('collection');
    const tenantId = searchParams.get('tenantId');
    const filtersParam = searchParams.get('filters');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Parse filters from JSON string if provided
    let filters = {};
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid filters JSON format' }, 
          { status: 400 }
        );
      }
    }

    // Reuse POST logic
    const mockRequest = {
      json: async () => ({
        collection: collectionName,
        tenantId,
        filters,
        search,
        sortBy,
        sortOrder,
        limit
      })
    } as NextRequest;

    return POST(mockRequest);

  } catch (error: any) {
    console.error('Error in universal query GET:', error);
    return NextResponse.json(
      { error: 'Query failed', message: error.message }, 
      { status: 500 }
    );
  }
}
