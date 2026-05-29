import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.EVOLUTION_API_URL || '';
  const apiKey = process.env.EVOLUTION_API_KEY || '';

  if (!apiUrl || !apiKey) {
    console.warn('[API] Evolution API credentials not configured in environment variables');
  }

  return NextResponse.json({ apiUrl, apiKey });
}
