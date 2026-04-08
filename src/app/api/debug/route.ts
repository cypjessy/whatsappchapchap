import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET" : "NOT SET",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "NOT SET",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "NOT SET",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "SET" : "NOT SET",
    },
    evolution: {
      apiUrl: process.env.EVOLUTION_API_URL ? "SET" : "NOT SET",
      apiKey: process.env.EVOLUTION_API_KEY ? "SET" : "NOT SET",
    },
  });
}
