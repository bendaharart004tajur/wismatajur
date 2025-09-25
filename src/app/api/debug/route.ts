import { NextResponse } from 'next/server';

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyExists = !!process.env.GOOGLE_PRIVATE_KEY;
  const testVar = process.env.IS_THIS_WORKING;

  console.log('--- DEBUGGING ENV VARS ---');
  console.log('IS_THIS_WORKING:', testVar);
  console.log('GOOGLE_SHEET_ID:', sheetId);
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', email);
  console.log('GOOGLE_PRIVATE_KEY Exists:', privateKeyExists);
  console.log('--------------------------');

  return NextResponse.json({
    message: "Debugging environment variables from the /api/debug endpoint.",
    testVariable: testVar || "--- NOT DEFINED ---",
    sheetId: sheetId || "--- NOT DEFINED ---",
    email: email || "--- NOT DEFINED ---",
    privateKeyExists: privateKeyExists,
  });
}
