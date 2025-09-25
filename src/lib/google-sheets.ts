
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Scopes required for Google Sheets API
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Function to get authenticated Google Sheets client
export async function getGoogleSheetsClient() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Missing Google service account credentials.');
  }

  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
if (!SPREADSHEET_ID) {
  throw new Error('Missing GOOGLE_SHEET_ID.');
}

// Helper to convert sheet data to JSON
// Assumes the first row is the header
export function sheetDataToJson<T>(values: any[][]): T[] {
    if (!values || values.length < 2) {
        return [];
    }
    const header = values[0];
    const dataRows = values.slice(1);

    return dataRows.map(row => {
        const rowData: any = {};
        header.forEach((key, index) => {
            rowData[key] = row[index];
        });
        return rowData as T;
    });
}
