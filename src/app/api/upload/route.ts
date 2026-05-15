import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import sharp from "sharp";

// ✅ Initialize Firebase Admin - separate from Firestore
function initAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
}

// Firestore helper (if needed elsewhere)
function getAdminDb() {
  initAdmin();
  return getFirestore();
}

const BUNNY_STORAGE_HOST = process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST || "jh.storage.bunnycdn.com";
const BUNNY_STORAGE_ZONE = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || "histoview";
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_API_KEY || "213c0699-7662-4802-8017bd573513-a997-4abe";
const BUNNY_CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || "https://histoview.b-cdn.net";

console.log("Upload API - Using Bunny config:", {
  host: BUNNY_STORAGE_HOST,
  zone: BUNNY_STORAGE_ZONE,
  keySet: !!BUNNY_STORAGE_API_KEY,
  cdnUrl: BUNNY_CDN_URL
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // ✅ Initialize Firebase Admin BEFORE verifying token
    let userId: string;
    try {
      initAdmin();
      const decodedToken = await getAdminAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (err) {
      // Detailed error logging for debugging token issues
      console.error('[Upload API] 🔴 Token verification failed:', err);
      console.error('[Upload API] Token details:', {
        tokenLength: token?.length || 0,
        tokenPrefix: token?.substring(0, 20) || 'empty',
        timestamp: new Date().toISOString(),
        hasFirebaseConfig: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        adminInitialized: getApps().length > 0,
      });
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!BUNNY_STORAGE_HOST || !BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_API_KEY) {
      return NextResponse.json({ error: "Bunny Storage not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress image with Sharp before uploading
    let compressedBuffer: Buffer;
    try {
      compressedBuffer = await sharp(buffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 75 })
        .toBuffer();
      
      console.log(`API: Image compressed - Original: ${buffer.length} bytes, Compressed: ${compressedBuffer.length} bytes`);
    } catch (compressError) {
      console.error('API: Compression failed, using original:', compressError);
      // Fallback to original if compression fails (e.g., non-image files)
      compressedBuffer = buffer;
    }

    const tenantId = `tenant_${userId}`;
    const timestamp = Date.now();
    // Always use .webp extension for compressed images
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.[^.]+$/, '');
    const filename = `${timestamp}-${sanitizedName}.webp`;
    const path = `${tenantId}/${folder}/${filename}`;
    const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${path}`;

    const uint8Array = new Uint8Array(compressedBuffer);

    console.log("API: Uploading to:", uploadUrl);

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/webp", // ✅ Always webp after compression
        "AccessKey": BUNNY_STORAGE_API_KEY!,
      },
      body: uint8Array,
    });

    console.log("API: Upload response:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Upload failed: ${errorText}` }, { status: 500 });
    }

    const url = `${BUNNY_CDN_URL}/${path}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Verify token before delete operation
    const token = authHeader.split("Bearer ")[1];
    try {
      initAdmin();
      await getAdminAuth().verifyIdToken(token);
    } catch (err) {
      console.error('[Upload API DELETE] Token verification failed:', err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    if (!BUNNY_STORAGE_HOST || !BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_API_KEY) {
      return NextResponse.json({ error: "Bunny Storage not configured" }, { status: 500 });
    }

    const urlParts = fileUrl.split(`/${BUNNY_STORAGE_ZONE}/`);
    if (urlParts.length < 2) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    const path = urlParts[urlParts.length - 1];
    const deleteUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${path}`;

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "AccessKey": BUNNY_STORAGE_API_KEY!,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
