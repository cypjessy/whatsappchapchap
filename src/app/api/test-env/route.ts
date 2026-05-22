import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const envVars = {
    bunny_host: process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST || "NOT SET",
    bunny_zone: process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || "NOT SET",
    bunny_key: process.env.BUNNY_API_KEY || "NOT SET",
    bunny_cdn: process.env.NEXT_PUBLIC_BUNNY_CDN_URL || "NOT SET",
  };

  return NextResponse.json({
    message: "Environment check",
    envVars,
    allSet: !!(process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST && process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE && process.env.BUNNY_API_KEY && process.env.NEXT_PUBLIC_BUNNY_CDN_URL),
  });
}
