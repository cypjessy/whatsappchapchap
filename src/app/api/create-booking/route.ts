import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

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

    // Get service data to extract tenantId
    const serviceDoc = await getDoc(doc(db, 'services', serviceId));
    if (!serviceDoc.exists()) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const serviceData = serviceDoc.data();
    const tenantId = serviceData.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Service has no tenant ID' },
        { status: 400 }
      );
    }

    // Create booking document
    const bookingRef = doc(collection(db, 'bookings'));
    const bookingId = bookingRef.id;

    // Generate client initials
    const nameParts = customerName.split(' ');
    const clientInitials = nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : customerName.substring(0, 2).toUpperCase();

    const bookingData = {
      id: bookingId,
      tenantId,
      client: customerName,
      clientInitials,
      phone: customerPhone,
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Additional metadata
      bookingSource: 'public-link',
      package: selectedPackage || 'standard',
    };

    await setDoc(bookingRef, bookingData);

    console.log('Booking created successfully:', bookingId);

    return NextResponse.json({
      success: true,
      bookingId,
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
