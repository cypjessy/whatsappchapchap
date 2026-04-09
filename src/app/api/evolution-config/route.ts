import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    apiUrl: process.env.EVOLUTION_API_URL || "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
    apiKey: process.env.EVOLUTION_API_KEY || "lhnGSMQrQmC54PyPUBqILuWWeau20gDn",
  });
}
