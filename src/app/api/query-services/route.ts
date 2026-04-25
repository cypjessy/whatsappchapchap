import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, serviceName, category, search } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    let q = query(collection(db, 'services'), where('tenantId', '==', tenantId));

    // Filter by search term
    if (search) {
      // Note: Firestore doesn't support full-text search, so we'll filter client-side
      const snapshot = await getDocs(q);
      const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filtered = services.filter(s => 
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
      );
      
      return NextResponse.json({ services: filtered });
    }

    // Filter by category
    if (category) {
      q = query(q, where('category', '==', category));
    }

    // Get all services
    const snapshot = await getDocs(q);
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // If specific service name requested
    if (serviceName) {
      const found = services.find(s => 
        s.name?.toLowerCase().includes(serviceName.toLowerCase())
      );
      
      if (found) {
        return NextResponse.json({ 
          service: found,
          message: `Found service: ${found.name}\nPrice: KES ${found.price?.toLocaleString()}\nDuration: ${found.duration || 'N/A'}\n${found.description || ''}`
        });
      }
      
      return NextResponse.json({ 
        services: services.slice(0, 5),
        message: `Service "${serviceName}" not found. Here are available services:`
      });
    }

    return NextResponse.json({ services });

  } catch (error: any) {
    console.error('Error querying services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const serviceName = searchParams.get('serviceName');
    const category = searchParams.get('category');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    let q = query(collection(db, 'services'), where('tenantId', '==', tenantId));

    if (category) {
      q = query(q, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (serviceName) {
      const found = services.find(s => 
        s.name?.toLowerCase().includes(serviceName.toLowerCase())
      );
      
      if (found) {
        return NextResponse.json({ 
          service: found,
          message: `Found service: ${found.name}\nPrice: KES ${found.price?.toLocaleString()}\nDuration: ${found.duration || 'N/A'}\n${found.description || ''}`
        });
      }
      
      return NextResponse.json({ 
        services: services.slice(0, 5),
        message: `Service "${serviceName}" not found. Here are available services:`
      });
    }

    return NextResponse.json({ services });

  } catch (error: any) {
    console.error('Error querying services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
