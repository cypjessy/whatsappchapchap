/**
 * Universal Database Query Helper
 * 
 * This utility provides a simple interface to query any collection
 * in your Firestore database through the /api/query-database endpoint.
 */

export interface QueryOptions {
  collection: string;
  tenantId: string;
  filters?: Record<string, any>;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface QueryResponse {
  success: boolean;
  collection: string;
  count: number;
  results: any[];
  error?: string;
}

/**
 * Query the database with flexible parameters
 * 
 * @example
 * // Get all active products
 * const products = await queryDatabase({
 *   collection: 'products',
 *   tenantId: 'tenant_123',
 *   filters: { status: 'active' }
 * });
 * 
 * @example
 * // Search for services
 * const services = await queryDatabase({
 *   collection: 'services',
 *   tenantId: 'tenant_123',
 *   search: 'massage',
 *   limit: 10
 * });
 */
export async function queryDatabase(options: QueryOptions): Promise<QueryResponse> {
  try {
    const response = await fetch('/api/query-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection: options.collection,
        tenantId: options.tenantId,
        filters: options.filters || {},
        search: options.search,
        sortBy: options.sortBy || 'createdAt',
        sortOrder: options.sortOrder || 'desc',
        limit: options.limit || 20
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        collection: options.collection,
        count: 0,
        results: [],
        error: errorData.error || 'Query failed'
      };
    }

    const data = await response.json();
    return data;

  } catch (error: any) {
    console.error('queryDatabase error:', error);
    return {
      success: false,
      collection: options.collection,
      count: 0,
      results: [],
      error: error.message || 'Network error'
    };
  }
}

/**
 * Quick query helpers for common use cases
 */
export const quickQueries = {
  /**
   * Get all items from a collection
   */
  getAll: (collection: string, tenantId: string, limit = 50) => 
    queryDatabase({ collection, tenantId, limit }),

  /**
   * Search across text fields
   */
  search: (collection: string, tenantId: string, searchTerm: string, limit = 20) =>
    queryDatabase({ collection, tenantId, search: searchTerm, limit }),

  /**
   * Filter by exact field match
   */
  filter: (collection: string, tenantId: string, field: string, value: any, limit = 50) =>
    queryDatabase({ collection, tenantId, filters: { [field]: value }, limit }),

  /**
   * Get items sorted by a specific field
   */
  sorted: (collection: string, tenantId: string, sortBy: string, sortOrder: 'asc' | 'desc' = 'desc', limit = 20) =>
    queryDatabase({ collection, tenantId, sortBy, sortOrder, limit }),
};
