
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { Warga, Pengurus, AnggotaKeluarga, Iuran, Pengeluaran, Peran, Pendapatan, Inventaris, Pengumuman } from '@/lib/types';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

// Scopes and Client Auth
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export async function getGoogleSheetsClient() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Missing Google service account credentials in environment variables.');
  }

  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

export const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
if (!SPREADSHEET_ID) {
  throw new Error('Missing GOOGLE_SHEET_ID in environment variables.');
}

// --- Generic Helper Functions ---

async function getSheetData(sheets: any, range: string) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
    });
    return response.data.values || [];
}

function sheetDataToJson<T>(values: any[][]): T[] {
    if (!values || values.length < 2) {
        return [];
    }
    const header = values[0];
    const dataRows = values.slice(1);
    return dataRows.map(row => {
        const rowData: any = {};
        header.forEach((key, index) => {
            // Convert numeric strings to numbers for specific fields
            const numericFields = ['jumlah', 'nominal', 'iuranLingkungan', 'iuranSosial', 'iuranMasjid', 'totalIuran', 'tahun'];
            if (numericFields.includes(key) && row[index] && !isNaN(Number(row[index]))) {
                 rowData[key] = Number(row[index]);
            } else {
                 rowData[key] = row[index];
            }
        });
        return rowData as T;
    });
}

async function findRowIndex(sheets: any, sheetName: string, id: string, idColumn: string): Promise<number> {
    const values = await getSheetData(sheets, sheetName);
    const header = values[0];
    const idColIndex = header.indexOf(idColumn);
    if (idColIndex === -1) throw new Error(`Column '${idColumn}' not found in sheet '${sheetName}'.`);
    
    const rowIndex = values.findIndex(row => row[idColIndex] === id);
    if (rowIndex === -1) return -1;
    
    return rowIndex + 1; // Return 1-based index for sheet range
}


async function deleteRow(sheets: any, sheetName: string, rowIndex: number) {
    const sheetId = await getSheetIdByName(sheets, sheetName);
    if (sheetId === null) {
        throw new Error(`Sheet with name "${sheetName}" not found.`);
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: sheetId,
                        dimension: 'ROWS',
                        startIndex: rowIndex - 1,
                        endIndex: rowIndex
                    }
                }
            }]
        }
    });
}

async function getSheetIdByName(sheets: any, sheetName: string): Promise<number | null> {
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
    return sheet?.properties?.sheetId ?? null;
}


// --- Warga ---
const WARGA_SHEET_NAME = 'Warga';

export async function getWargaDataFromSheet(peran?: Peran, wargaId?: string, blok?: string): Promise<Warga[]> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, WARGA_SHEET_NAME);
    let warga = sheetDataToJson<Warga>(values);

    if (peran === 'User' && wargaId) {
        return warga.filter(w => w.wargaId === wargaId);
    }
    if (peran === 'Koordinator' && blok) {
        return warga.filter(w => w.blok === blok);
    }
    return warga;
}

export async function addWargaToSheet(warga: Omit<Warga, 'wargaId' | 'tanggalinput'>): Promise<Warga> {
    const sheets = await getGoogleSheetsClient();
    const newWarga: Warga = {
        ...warga,
        wargaId: randomUUID(),
        tanggalinput: new Date().toISOString(),
    };
    const values = await getSheetData(sheets, WARGA_SHEET_NAME);
    const header = values[0];
    const newRow = header.map((h: string) => newWarga[h as keyof Warga] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: WARGA_SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
    });
    return newWarga;
}

export async function updateWargaInSheet(warga: Partial<Warga> & { wargaId: string }): Promise<Warga> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, WARGA_SHEET_NAME);
    const header = values[0];
    const rowIndex = await findRowIndex(sheets, WARGA_SHEET_NAME, warga.wargaId, 'wargaId');

    if (rowIndex === -1) throw new Error('Warga not found');
    
    // Fetch the full row to update
    const fullWargaList = sheetDataToJson<Warga>(values);
    const existingWarga = fullWargaList.find(w => w.wargaId === warga.wargaId);
    if (!existingWarga) throw new Error('Warga not found in JSON data.');

    const updatedWarga = { ...existingWarga, ...warga };
    const updatedRow = header.map((h: string) => updatedWarga[h as keyof Warga] ?? '');

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${WARGA_SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
    });
    return updatedWarga;
}

export async function deleteWargaFromSheet(wargaId: string): Promise<void> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, WARGA_SHEET_NAME, wargaId, 'wargaId');
    if (rowIndex === -1) throw new Error('Warga not found');
    await deleteRow(sheets, WARGA_SHEET_NAME, rowIndex);
}


// --- Pengurus ---
const PENGURUS_SHEET_NAME = 'Pengurus';
export async function getPengurusDataFromSheet(): Promise<Pengurus[]> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENGURUS_SHEET_NAME);
    return sheetDataToJson<Pengurus>(values);
}

export async function addPengurusToSheet(pengurus: Pengurus): Promise<Pengurus> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENGURUS_SHEET_NAME);
    const header = values[0];
    
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(pengurus.password, 10);
    const newPengurus = { ...pengurus, password: hashedPassword };

    const newRow = header.map((h: string) => newPengurus[h as keyof Pengurus] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: PENGURUS_SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
    });
    return newPengurus;
}

export async function updatePengurusInSheet(pengurus: Partial<Pengurus> & { id: string }): Promise<Pengurus> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENGURUS_SHEET_NAME);
    const header = values[0];
    const rowIndex = await findRowIndex(sheets, PENGURUS_SHEET_NAME, pengurus.id, 'id');

    if (rowIndex === -1) throw new Error('Pengurus not found');

    const fullPengurusList = sheetDataToJson<Pengurus>(values);
    const existingPengurus = fullPengurusList.find(p => p.id === pengurus.id);
    if (!existingPengurus) throw new Error('Pengurus not found in JSON data.');
    
    let dataToUpdate = { ...pengurus };
    if (dataToUpdate.password) {
        dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
    } else {
        // If password is not being updated, keep the old one.
        delete dataToUpdate.password;
    }

    const updatedPengurus = { ...existingPengurus, ...dataToUpdate };
    const updatedRow = header.map((h: string) => updatedPengurus[h as keyof Pengurus] ?? '');
    
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${PENGURUS_SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
    });
    return updatedPengurus;
}

export async function deletePengurusFromSheet(id: string): Promise<void> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, PENGURUS_SHEET_NAME, id, 'id');
    if (rowIndex === -1) throw new Error('Pengurus not found');
    await deleteRow(sheets, PENGURUS_SHEET_NAME, rowIndex);
}


// --- Anggota Keluarga ---
const ANGGOTA_KELUARGA_SHEET_NAME = 'AnggotaKeluarga';

export async function getAnggotaKeluargaDataFromSheet(): Promise<AnggotaKeluarga[]> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, ANGGOTA_KELUARGA_SHEET_NAME);
    return sheetDataToJson<AnggotaKeluarga>(values);
}

export async function addAnggotaKeluargaToSheet(anggota: AnggotaKeluarga): Promise<AnggotaKeluarga> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, ANGGOTA_KELUARGA_SHEET_NAME);
    const header = values[0];
    const newRow = header.map((h: string) => anggota[h as keyof AnggotaKeluarga] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: ANGGOTA_KELUARGA_SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
    });
    return anggota;
}

export async function updateAnggotaKeluargaInSheet(anggota: Partial<AnggotaKeluarga> & { anggotaId: string }): Promise<AnggotaKeluarga> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, ANGGOTA_KELUARGA_SHEET_NAME, anggota.anggotaId, 'anggotaId');
    if (rowIndex === -1) throw new Error('Anggota Keluarga not found');

    const values = await getSheetData(sheets, ANGGOTA_KELUARGA_SHEET_NAME);
    const header = values[0];
    const existingRow = sheetDataToJson<AnggotaKeluarga>(values).find(a => a.anggotaId === anggota.anggotaId);
    if (!existingRow) throw new Error('Anggota Keluarga not found.');

    const updatedData = { ...existingRow, ...anggota };
    const updatedRow = header.map((h: string) => updatedData[h as keyof AnggotaKeluarga] ?? '');
    
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${ANGGOTA_KELUARGA_SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
    });
    return updatedData;
}

export async function deleteAnggotaKeluargaFromSheet(anggotaId: string): Promise<void> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, ANGGOTA_KELUARGA_SHEET_NAME, anggotaId, 'anggotaId');
    if (rowIndex === -1) throw new Error('Anggota Keluarga not found');
    await deleteRow(sheets, ANGGOTA_KELUARGA_SHEET_NAME, rowIndex);
}

// --- Iuran ---
const IURAN_SHEET_NAME = 'Iuran';

export async function getIuranDataFromSheet(): Promise<Iuran[]> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, IURAN_SHEET_NAME);
    return sheetDataToJson<Iuran>(values);
}

export async function addIuranToSheet(iuran: Omit<Iuran, 'iuranId'>): Promise<Iuran> {
    const sheets = await getGoogleSheetsClient();
    const newIuran: Iuran = {
        ...iuran,
        iuranId: randomUUID(),
    };
    const values = await getSheetData(sheets, IURAN_SHEET_NAME);
    const header = values[0];
    const newRow = header.map((h: string) => newIuran[h as keyof Iuran] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: IURAN_SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
    });
    return newIuran;
}

export async function updateIuranInSheet(iuran: Partial<Iuran> & { iuranId: string }): Promise<Iuran> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, IURAN_SHEET_NAME, iuran.iuranId, 'iuranId');
    if (rowIndex === -1) throw new Error('Iuran not found');

    const values = await getSheetData(sheets, IURAN_SHEET_NAME);
    const header = values[0];
    const existingRow = sheetDataToJson<Iuran>(values).find(i => i.iuranId === iuran.iuranId);
    if (!existingRow) throw new Error('Iuran not found.');

    const updatedData = { ...existingRow, ...iuran };
    const updatedRow = header.map((h: string) => updatedData[h as keyof Iuran] ?? '');
    
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${IURAN_SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
    });
    return updatedData;
}

export async function deleteIuranFromSheet(iuranId: string): Promise<void> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, IURAN_SHEET_NAME, iuranId, 'iuranId');
    if (rowIndex === -1) throw new Error('Iuran not found');
    await deleteRow(sheets, IURAN_SHEET_NAME, rowIndex);
}

// --- Pengeluaran ---
const PENGELUARAN_SHEET_NAME = 'Pengeluaran';

export async function getPengeluaranDataFromSheet(): Promise<Pengeluaran[]> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENGELUARAN_SHEET_NAME);
    return sheetDataToJson<Pengeluaran>(values);
}

export async function addPengeluaranToSheet(pengeluaran: Pengeluaran): Promise<Pengeluaran> {
     const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENGELUARAN_SHEET_NAME);
    const header = values[0];
    const newRow = header.map((h: string) => pengeluaran[h as keyof Pengeluaran] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: PENGELUARAN_SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
    });
    return pengeluaran;
}

export async function updatePengeluaranInSheet(pengeluaran: Partial<Pengeluaran> & { id: string }): Promise<Pengeluaran> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, PENGELUARAN_SHEET_NAME, pengeluaran.id, 'id');
    if (rowIndex === -1) throw new Error('Pengeluaran not found');

    const values = await getSheetData(sheets, PENGELUARAN_SHEET_NAME);
    const header = values[0];
    const existingRow = sheetDataToJson<Pengeluaran>(values).find(p => p.id === pengeluaran.id);
    if (!existingRow) throw new Error('Pengeluaran not found.');

    const updatedData = { ...existingRow, ...pengeluaran };
    const updatedRow = header.map((h: string) => updatedData[h as keyof Pengeluaran] ?? '');
    
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${PENGELUARAN_SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
    });
    return updatedData;
}

export async function deletePengeluaranFromSheet(id: string): Promise<void> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, PENGELUARAN_SHEET_NAME, id, 'id');
    if (rowIndex === -1) throw new Error('Pengeluaran not found');
    await deleteRow(sheets, PENGELUARAN_SHEET_NAME, rowIndex);
}

// --- Pendapatan ---
const PENDAPATAN_SHEET_NAME = 'Pendapatan';

export async function getPendapatanDataFromSheet(): Promise<Pendapatan[]> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENDAPATAN_SHEET_NAME);
    return sheetDataToJson<Pendapatan>(values);
}

export async function addPendapatanToSheet(pendapatan: Pendapatan): Promise<Pendapatan> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENDAPATAN_SHEET_NAME);
    const header = values[0];
    const newRow = header.map((h: string) => pendapatan[h as keyof Pendapatan] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: PENDAPATAN_SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
    });
    return pendapatan;
}

export async function updatePendapatanInSheet(pendapatan: Partial<Pendapatan> & { id: string }): Promise<Pendapatan> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, PENDAPATAN_SHEET_NAME, pendapatan.id, 'id');
    if (rowIndex === -1) throw new Error('Pendapatan not found');

    const values = await getSheetData(sheets, PENDAPATAN_SHEET_NAME);
    const header = values[0];
    const existingRow = sheetDataToJson<Pendapatan>(values).find(p => p.id === pendapatan.id);
    if (!existingRow) throw new Error('Pendapatan not found.');

    const updatedData = { ...existingRow, ...pendapatan };
    const updatedRow = header.map((h: string) => updatedData[h as keyof Pendapatan] ?? '');
    
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${PENDAPATAN_SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
    });
    return updatedData;
}

export async function deletePendapatanFromSheet(id: string): Promise<void> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, PENDAPATAN_SHEET_NAME, id, 'id');
    if (rowIndex === -1) throw new Error('Pendapatan not found');
    await deleteRow(sheets, PENDAPATAN_SHEET_NAME, rowIndex);
}

// --- Inventaris ---
const INVENTARIS_SHEET_NAME = 'Inventaris';

export async function getInventarisDataFromSheet(): Promise<Inventaris[]> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, INVENTARIS_SHEET_NAME);
    return sheetDataToJson<Inventaris>(values);
}

export async function addInventarisToSheet(inventaris: Inventaris): Promise<Inventaris> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, INVENTARIS_SHEET_NAME);
    const header = values[0];
    const newRow = header.map((h: string) => inventaris[h as keyof Inventaris] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: INVENTARIS_SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
    });
    return inventaris;
}

export async function updateInventarisInSheet(inventaris: Partial<Inventaris> & { id: string }): Promise<Inventaris> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, INVENTARIS_SHEET_NAME, inventaris.id, 'id');
    if (rowIndex === -1) throw new Error('Inventaris not found');

    const values = await getSheetData(sheets, INVENTARIS_SHEET_NAME);
    const header = values[0];
    const existingRow = sheetDataToJson<Inventaris>(values).find(i => i.id === inventaris.id);
    if (!existingRow) throw new Error('Inventaris not found.');
    
    const updatedData = { ...existingRow, ...inventaris };
    const updatedRow = header.map((h: string) => updatedData[h as keyof Inventaris] ?? '');

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${INVENTARIS_SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
    });
    return updatedData;
}

export async function deleteInventarisFromSheet(id: string): Promise<void> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, INVENTARIS_SHEET_NAME, id, 'id');
    if (rowIndex === -1) throw new Error('Inventaris not found');
    await deleteRow(sheets, INVENTARIS_SHEET_NAME, rowIndex);
}


// --- Pengumuman ---
const PENGUMUMAN_SHEET_NAME = 'Pengumuman';

export async function getPengumumanDataFromSheet(): Promise<Pengumuman[]> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENGUMUMAN_SHEET_NAME);
    return sheetDataToJson<Pengumuman>(values);
}

export async function addPengumumanToSheet(pengumuman: Pengumuman): Promise<Pengumuman> {
    const sheets = await getGoogleSheetsClient();
    const values = await getSheetData(sheets, PENGUMUMAN_SHEET_NAME);
    const header = values[0];
    const newRow = header.map((h: string) => pengumuman[h as keyof Pengumuman] ?? '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: PENGUMUMAN_SHEET_NAME,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
    });
    return pengumuman;
}

export async function updatePengumumanInSheet(pengumuman: Partial<Pengumuman> & { id: string }): Promise<Pengumuman> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, PENGUMUMAN_SHEET_NAME, pengumuman.id, 'id');
    if (rowIndex === -1) throw new Error('Pengumuman not found');
    
    const values = await getSheetData(sheets, PENGUMUMAN_SHEET_NAME);
    const header = values[0];
    const existingRow = sheetDataToJson<Pengumuman>(values).find(p => p.id === pengumuman.id);
    if (!existingRow) throw new Error('Pengumuman not found.');

    const updatedData = { ...existingRow, ...pengumuman };
    const updatedRow = header.map((h: string) => updatedData[h as keyof Pengumuman] ?? '');

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${PENGUMUMAN_SHEET_NAME}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRow] },
    });
    return updatedData;
}

export async function deletePengumumanFromSheet(id: string): Promise<void> {
    const sheets = await getGoogleSheetsClient();
    const rowIndex = await findRowIndex(sheets, PENGUMUMAN_SHEET_NAME, id, 'id');
     if (rowIndex === -1) throw new Error('Pengumuman not found');
    await deleteRow(sheets, PENGUMUMAN_SHEET_NAME, rowIndex);
}
