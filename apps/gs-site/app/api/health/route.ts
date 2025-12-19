import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    app: 'gs-site-dashboard',
    timestamp: new Date().toISOString(),
  });
}
