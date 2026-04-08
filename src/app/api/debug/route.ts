import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET" : "NOT SET",
    firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "NOT SET",
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "NOT SET",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "SET" : "NOT SET",
  });
}
