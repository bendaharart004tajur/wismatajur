'use server';

import { getGoogleSheetsClient, SPREADSHEET_ID, sheetDataToJson } from '../google-sheets';
import { Warga } from '../types';

// The range should cover all columns for the Warga sheet.
// Based on the Warga type, there are 13 properties.
const WARGA_RANGE = 'Warga!A:M'; 

export async function getWarga(): Promise<Warga[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: WARGA_RANGE,
    });

    const values = response.data.values;
    if (!values) {
      return [];
    }

    // The sheetDataToJson helper converts the 2D array to an array of objects.
    return sheetDataToJson<Warga>(values);

  } catch (error) {
    console.error('Error fetching warga data from Google Sheets:', error);
    // In case of an error, we return an empty array to prevent the app from crashing.
    return [];
  }
}
