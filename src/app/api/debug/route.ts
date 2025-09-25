import { NextResponse } from 'next/server';

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyExists = !!process.env.GOOGLE_PRIVATE_KEY;

  return NextResponse.json({
    message: "Debugging environment variables from the /api/debug endpoint.",
    sheetId: sheetId || "--- NOT DEFINED ---",
    email: email || "--- NOT DEFINED ---",
    privateKeyExists: privateKeyExists,
  });
}
