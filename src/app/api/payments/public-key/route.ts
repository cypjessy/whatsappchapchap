import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Public API endpoint to fetch a tenant's Paystack public key.
 * No authentication required — the checkout page is customer-facing.
 * Only returns the public key (safe to expose to client).
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const doc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("settings")
      .doc("paystack")
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Paystack not configured for this tenant" },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    const mode = data.mode || "test";
    const publicKey = mode === "live" ? data.livePublicKey : data.testPublicKey;

    if (!publicKey) {
      return NextResponse.json(
        { error: `Paystack public key not configured for ${mode} mode` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      publicKey,
      mode,
    });
  } catch (error: any) {
    console.error("Error fetching Paystack public key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Paystack configuration" },
      { status: 500 }
    );
  }
}
