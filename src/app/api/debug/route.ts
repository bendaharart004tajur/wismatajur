
import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    // We check for the names used in production
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID ? 'Defined' : 'UNDEFINED',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Defined' : 'UNDEFINED',
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'Defined' : 'UNDEFINED',
    
    // We also check for the names used by the emulator, just in case
    GOOGLE_SHEET_ID_SECRET: process.env.GOOGLE_SHEET_ID_SECRET ? 'Defined' : 'UNDEFINED',

    // Node environment
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json(diagnostics);
}
