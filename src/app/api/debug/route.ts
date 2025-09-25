import { NextResponse } from 'next/server';

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // We don't want to expose the private key, just check if it exists.
  const privateKeyExists = !!process.env.GOOGLE_PRIVATE_KEY;

  console.log('--- DEBUGGING ENV VARS ---');
  console.log('GOOGLE_SHEET_ID:', sheetId);
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', email);
  console.log('GOOGLE_PRIVATE_KEY Exists:', privateKeyExists);
  console.log('--------------------------');

  return NextResponse.json({
    message: "Debugging environment variables from the /api/debug endpoint.",
    sheetId: sheetId || "--- NOT DEFINED ---",
    email: email || "--- NOT DEFINED ---",
    privateKeyExists: privateKeyExists,
  });
}
