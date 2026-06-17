import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password, firstName, lastName, phone, businessName, businessType, category, country, currency } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !businessName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, firstName, lastName, businessName" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error: Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    // Verify the requesting user is an admin by checking their auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing auth token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    let adminUid: string;
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      adminUid = decodedToken.uid;
    } catch {
      return NextResponse.json(
        { error: "Unauthorized: Invalid auth token" },
        { status: 401 }
      );
    }

    // Verify the requester has admin role
    const adminTenantDoc = await adminDb.collection("tenants").doc(`tenant_${adminUid}`).get();
    const adminData = adminTenantDoc.data();
    const adminRole = adminData?.role;
    if (adminRole !== "admin" && adminRole !== "superadmin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    // Create the new user in Firebase Auth using Admin SDK
    const newUser = await getAuth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phone ? `+${phone.replace(/^\+/, "")}` : undefined,
    });

    const tenantId = `tenant_${newUser.uid}`;

    // Create the tenant document in Firestore
    await adminDb.collection("tenants").doc(tenantId).set({
      id: tenantId,
      userId: newUser.uid,
      name: `${firstName} ${lastName}`,
      email,
      phone: phone || "",
      businessName,
      businessType: businessType || "",
      category: category || "",
      country: country || "KE",
      currency: currency || "KES (Kenyan Shilling)",
      plan: "free",
      status: "active",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Also create a minimal business profile
    await adminDb.collection("businessProfiles").doc(tenantId).set({
      tenantId,
      businessName,
      email,
      phone: phone || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      uid: newUser.uid,
      tenantId,
      email: newUser.email,
    });
  } catch (error: any) {
    console.error("[API] Error creating tenant:", error);

    // Handle Firebase Auth errors (e.g., email already exists)
    if (error?.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (error?.code?.startsWith("auth/")) {
      return NextResponse.json(
        { error: `Authentication error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to create tenant" },
      { status: 500 }
    );
  }
}
