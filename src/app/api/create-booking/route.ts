import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { normalizePhone } from '@/utils/phoneUtils';
import { generateBookingNumber } from '@/utils/bookingNumber';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      serviceId,
      customerName,
      customerPhone,
      selectedDate,
      selectedTime,
      selectedLocation,
      selectedPackage,
      packagePrice,
      notes
    } = body;

    // Validate required fields
    if (!serviceId || !customerName || !customerPhone || !selectedDate || !selectedTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get service data to extract tenantId using Admin SDK
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }
    
    const serviceDoc = await adminDb.collection('services').doc(serviceId).get();
    
    if (!serviceDoc.exists) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const serviceData = serviceDoc.data();
    const tenantId = serviceData?.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Service has no tenant ID' },
        { status: 400 }
      );
    }

    // Create booking document with auto-generated ID
    const bookingRef = adminDb.collection('bookings').doc();
    const bookingId = bookingRef.id;

    // Generate client initials (handle empty strings and trailing spaces)
    const nameParts = customerName.trim().split(/\s+/).filter((n: string) => n.length > 0);
    const clientInitials = nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0]?.substring(0, 2).toUpperCase() || '??';

    // Normalize phone to international format for WhatsApp compatibility
    const normalizedPhone = normalizePhone(customerPhone);

    // Generate human-readable booking number
    const bookingNumber = generateBookingNumber();
    
    const bookingData = {
      id: bookingId,
      tenantId,
      bookingNumber, // ✅ Add generated booking number for display
      client: customerName,
      clientInitials,
      phone: normalizedPhone,
      service: serviceData.name || 'Unknown Service',
      serviceId,
      date: selectedDate,
      time: selectedTime,
      duration: serviceData.duration || '60 min',
      location: selectedLocation || 'Not specified',
      price: packagePrice || 0,
      status: 'pending',
      verified: false,
      notes: notes || '',
      deposit: 0,
      balance: packagePrice || 0,
      paymentMethod: 'cash',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Additional metadata
      bookingSource: 'public-link',
      package: selectedPackage || 'standard',
    };

    await bookingRef.set(bookingData);

    console.log('Booking created successfully:', bookingId);

    return NextResponse.json({
      success: true,
      bookingId,
      bookingNumber,
      message: 'Booking created successfully'
    });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create booking',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
