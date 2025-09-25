

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { Peran, Warga, Pengurus, AnggotaKeluarga, Inventaris, Pengumuman, Pengeluaran, Iuran, Pendapatan } from '@/lib/types';
import bcrypt from 'bcryptjs';

// This function creates a new JWT auth object and gets the spreadsheet document.
// It is designed to be called just-in-time within each service function.
// This ensures that it always uses the latest environment variables provided by the App Hosting environment.
async function getDoc() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!sheetId) {
        // This error message is now more specific to the actual problem.
        throw new Error('GOOGLE_SHEET_ID is not defined in the hosting environment.');
    }
     if (!serviceAccountEmail || !privateKey) {
        throw new Error('Google service account credentials are not defined in the hosting environment.');
    }

    const serviceAccountAuth = new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}


// Function to get all sheet titles
export async function getSheetTitles(): Promise<string[]> {
  try {
    const doc = await getDoc();
    return doc.sheetsByIndex.map(sheet => sheet.title);
  } catch (error) {
    console.error('Error fetching sheet titles:', error);
    throw error;
  }
}

// ====== WARGA ======

export async function getWargaDataFromSheet(peran?: Peran, wargaId?: string, blok?: string): Promise<Warga[]> {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['warga'];
     if (!sheet) {
      throw new Error("Worksheet 'warga' not found");
    }
    const rows = await sheet.getRows();
    let data: Warga[] = rows.map(row => ({
        wargaId: row.get('wargaId'),
        nama: row.get('nama'),
        email: row.get('email'),
        jeniskelamin: row.get('jeniskelamin'),
        blok: row.get('blok'),
        norumah: row.get('norumah'),
        phone: row.get('phone'),
        statustempattinggal: row.get('statustempattinggal'),
        statusktp: row.get('statusktp'),
        kontakdarurat: row.get('kontakdarurat'),
        fotoprofilurl: row.get('fotoprofilurl'),
        uploadktpurl: row.get('uploadktpurl'),
        tanggalinput: row.get('tanggalinput'),
    } as Warga)).filter(w => w && w.wargaId && w.nama);

    if (peran === 'Admin') {
      return data;
    } else if (peran === 'Koordinator' && blok) {
      return data.filter(w => w.blok === blok);
    } else if (peran === 'User' && wargaId) {
      return data.filter(w => w.wargaId === wargaId);
    } else if (!peran) {
        // If no role is specified, assume it's for general list fetching (like for selection)
        return data;
    }
    return [];

  } catch (error) {
     console.error('Error fetching warga data from Google Sheet:', error);
     throw error;
  }
}

export async function addWargaToSheet(warga: Warga): Promise<Warga> {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['warga'];
     if (!sheet) {
      throw new Error("Worksheet 'warga' not found");
    }
    
    await sheet.addRow(warga);
    
    return warga;

  } catch (error) {
     console.error('Error adding new warga to Google Sheet:', error);
    throw error;
  }
}

export async function updateWargaInSheet(warga: Partial<Warga> & { wargaId: string }): Promise<Warga> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['warga'];
    if (!sheet) {
      throw new Error("Worksheet 'warga' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('wargaId')?.toString().trim() === warga.wargaId?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Warga not found in sheet for update');
    }

    const rowToUpdate = rows[rowIndex];
    const dataToUpdate = { ...warga };

    // Update fields in the sheet
    for (const key in dataToUpdate) {
        if (key !== 'wargaId' && dataToUpdate.hasOwnProperty(key)) {
            rowToUpdate.set(key, (dataToUpdate as any)[key] || '');
        }
    }

    await rowToUpdate.save();

    const updatedData = { ...rowToUpdate.toObject(), ...dataToUpdate };
    return updatedData as Warga;
}

export async function deleteWargaFromSheet(wargaId: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['warga'];
    if (!sheet) {
        throw new Error("Worksheet 'warga' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('wargaId')?.toString().trim() === wargaId?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Warga not found in sheet for deletion');
    }

    await rows[rowIndex].delete();
}

// ====== ANGGOTA KELUARGA ======

export async function getAnggotaKeluargaDataFromSheet(wargaId?: string | null): Promise<AnggotaKeluarga[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['anggotakeluarga'];
        if (!sheet) {
            throw new Error("Worksheet 'anggotakeluarga' not found");
        }
        const rows = await sheet.getRows();
        let data: AnggotaKeluarga[] = rows.map(row => ({
            anggotaId: row.get('anggotaId'),
            wargaId: row.get('wargaId'),
            nokk: row.get('nokk'),
            nama: row.get('nama'),
            hubungan: row.get('hubungan'),
            jeniskelamin: row.get('jeniskelamin'),
            tanggallahir: row.get('tanggallahir'),
            uploadkkurl: row.get('uploadkkurl'),
            tanggalinput: row.get('tanggalinput'),
        } as AnggotaKeluarga)).filter(ak => ak && ak.anggotaId);

        // If wargaId is provided, filter by it. Otherwise, return all.
        if (wargaId) {
            return data.filter(ak => ak.wargaId === wargaId);
        }

        return data;

    } catch (error) {
        console.error('Error fetching anggota keluarga data from Google Sheet:', error);
        throw error;
    }
}

export async function addAnggotaKeluargaToSheet(anggota: AnggotaKeluarga): Promise<AnggotaKeluarga> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['anggotakeluarga'];
        if (!sheet) {
            throw new Error("Worksheet 'anggotakeluarga' not found");
        }

        await sheet.addRow(anggota);

        return anggota;

    } catch (error) {
        console.error('Error adding new anggota keluarga to Google Sheet:', error);
        throw error;
    }
}

export async function updateAnggotaKeluargaInSheet(anggota: Partial<AnggotaKeluarga> & { anggotaId: string }): Promise<AnggotaKeluarga> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['anggotakeluarga'];
    if (!sheet) {
        throw new Error("Worksheet 'anggotakeluarga' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('anggotaId')?.toString().trim() === anggota.anggotaId?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Anggota keluarga not found in sheet for update');
    }

    const rowToUpdate = rows[rowIndex];
    const dataToUpdate = { ...anggota };

    for (const key in dataToUpdate) {
        if (key !== 'anggotaId' && dataToUpdate.hasOwnProperty(key)) {
            rowToUpdate.set(key, (dataToUpdate as any)[key] || '');
        }
    }

    await rowToUpdate.save();

    const updatedData = { ...rowToUpdate.toObject(), ...dataToUpdate };
    return updatedData as AnggotaKeluarga;
}

export async function deleteAnggotaKeluargaFromSheet(anggotaId: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['anggotakeluarga'];
    if (!sheet) {
        throw new Error("Worksheet 'anggotakeluarga' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('anggotaId')?.toString().trim() === anggotaId?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Anggota keluarga not found in sheet for deletion');
    }

    await rows[rowIndex].delete();
}


// ====== PENGURUS ======

export async function getPengurusDataFromSheet(): Promise<Pengurus[]> {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['pengurus'];
    if (!sheet) {
      throw new Error("Worksheet 'pengurus' not found");
    }
    const rows = await sheet.getRows();
    return rows.map(row => ({
      id: row.get('id'),
      wargaId: row.get('wargaId'),
      nama: row.get('nama'),
      email: row.get('email'),
      jabatan: row.get('jabatan'),
      peran: row.get('peran'),
      blok: row.get('blok'),
      password: row.get('password'),
      tanggalInput: row.get('tanggalInput'),
      fotoProfil: row.get('fotoProfil')
    } as Pengurus)).filter(p => p && p.id && p.wargaId);

  } catch (error) {
    console.error('Error fetching pengurus data from Google Sheet:', error);
    throw error;
  }
}

export async function addPengurusToSheet(pengurus: Pengurus): Promise<Pengurus> {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['pengurus'];
    if (!sheet) {
      throw new Error("Worksheet 'pengurus' not found");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pengurus.password, salt);
    
    const pengurusToAdd = {
        ...pengurus,
        password: hashedPassword,
    };
    
    await sheet.addRow(pengurusToAdd);
    
    return pengurusToAdd;

  } catch (error) {
    console.error('Error adding new pengurus to Google Sheet:', error);
    throw error;
  }
}

export async function updatePengurusInSheet(pengurus: Partial<Pengurus> & { id: string }): Promise<Pengurus> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['pengurus'];
    if (!sheet) {
      throw new Error("Worksheet 'pengurus' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === pengurus.id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Pengurus not found in sheet for update');
    }

    const rowToUpdate = rows[rowIndex];
    const dataToUpdate = { ...pengurus };

    if (dataToUpdate.password && dataToUpdate.password.length > 0) {
        const salt = await bcrypt.genSalt(10);
        dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, salt);
    } else {
        delete dataToUpdate.password;
    }

    for (const key in dataToUpdate) {
        if (key !== 'id' && dataToUpdate.hasOwnProperty(key)) {
            rowToUpdate.set(key, (dataToUpdate as any)[key] || '');
        }
    }

    await rowToUpdate.save();

    const updatedData = { ...rowToUpdate.toObject(), ...dataToUpdate };
    return updatedData as Pengurus;
}

export async function deletePengurusFromSheet(id: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['pengurus'];
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Pengurus not found in sheet for deletion');
    }

    await rows[rowIndex].delete();
}

// ====== INVENTARIS ======

export async function getInventarisDataFromSheet(): Promise<Inventaris[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Inventaris'];
        if (!sheet) {
            throw new Error("Worksheet 'Inventaris' not found");
        }
        const rows = await sheet.getRows();
        return rows.map(row => ({
            id: row.get('id'),
            namaBarang: row.get('namaBarang'),
            jumlah: Number(row.get('jumlah')) || 0,
            lokasiPenyimpanan: row.get('lokasiPenyimpanan'),
            penanggungJawab: row.get('penanggungJawab'),
            keterangan: row.get('keterangan'),
            tanggalinput: row.get('tanggalinput'),
        } as Inventaris)).filter(i => i && i.id);
    } catch (error) {
        console.error('Error fetching inventaris data from Google Sheet:', error);
        throw error;
    }
}

export async function addInventarisToSheet(item: Inventaris): Promise<Inventaris> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Inventaris'];
        if (!sheet) {
            throw new Error("Worksheet 'Inventaris' not found");
        }
        await sheet.addRow(item);
        return item;
    } catch (error) {
        console.error('Error adding new inventaris to Google Sheet:', error);
        throw error;
    }
}

export async function updateInventarisInSheet(item: Partial<Inventaris> & { id: string }): Promise<Inventaris> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Inventaris'];
    if (!sheet) {
        throw new Error("Worksheet 'Inventaris' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === item.id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Inventaris item not found in sheet for update');
    }

    const rowToUpdate = rows[rowIndex];
    for (const key in item) {
        if (key !== 'id' && item.hasOwnProperty(key)) {
            rowToUpdate.set(key, (item as any)[key] || '');
        }
    }
    await rowToUpdate.save();

    const updatedData = { ...rowToUpdate.toObject(), ...item };
    return updatedData as Inventaris;
}

export async function deleteInventarisFromSheet(id: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Inventaris'];
    if (!sheet) {
        throw new Error("Worksheet 'Inventaris' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Inventaris item not found in sheet for deletion');
    }

    await rows[rowIndex].delete();
}

// ====== PENGUMUMAN ======

export async function getPengumumanDataFromSheet(): Promise<Pengumuman[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Pengumuman'];
        if (!sheet) {
            throw new Error("Worksheet 'Pengumuman' not found");
        }
        const rows = await sheet.getRows();
        return rows.map(row => ({
            id: row.get('id'),
            judul: row.get('judul'),
            isi: row.get('isi'),
            tanggalTerbit: row.get('tanggalTerbit'),
            penulis: row.get('penulis'),
            target: row.get('target'),
        } as Pengumuman)).filter(p => p && p.id);
    } catch (error) {
        console.error('Error fetching pengumuman data from Google Sheet:', error);
        throw error;
    }
}

export async function addPengumumanToSheet(item: Pengumuman): Promise<Pengumuman> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Pengumuman'];
        if (!sheet) {
            throw new Error("Worksheet 'Pengumuman' not found");
        }
        await sheet.addRow(item);
        return item;
    } catch (error) {
        console.error('Error adding new announcement to Google Sheet:', error);
        throw error;
    }
}

export async function updatePengumumanInSheet(item: Partial<Pengumuman> & { id: string }): Promise<Pengumuman> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Pengumuman'];
    if (!sheet) {
        throw new Error("Worksheet 'Pengumuman' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === item.id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Announcement not found in sheet for update');
    }

    const rowToUpdate = rows[rowIndex];
    for (const key in item) {
        if (key !== 'id' && item.hasOwnProperty(key)) {
            rowToUpdate.set(key, (item as any)[key] || '');
        }
    }
    await rowToUpdate.save();

    const updatedData = { ...rowToUpdate.toObject(), ...item };
    return updatedData as Pengumuman;
}

export async function deletePengumumanFromSheet(id: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Pengumuman'];
    if (!sheet) {
        throw new Error("Worksheet 'Pengumuman' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Announcement not found in sheet for deletion');
    }

    await rows[rowIndex].delete();
}

// ====== PENGELUARAN ======

export async function getPengeluaranDataFromSheet(): Promise<Pengeluaran[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Pengeluaran'];
        if (!sheet) {
            throw new Error("Worksheet 'Pengeluaran' not found");
        }
        const rows = await sheet.getRows();
        return rows.map(row => ({
            id: row.get('id'),
            tanggal: row.get('tanggal'),
            kategori: row.get('kategori'),
            subkategori: row.get('subkategori'),
            deskripsi: row.get('deskripsi'),
            jumlah: Number(row.get('jumlah')) || 0,
            metodePembayaran: row.get('metodePembayaran'),
            buktiUrl: row.get('buktiUrl'),
            dicatatOleh: row.get('dicatatOleh'),
        } as Pengeluaran)).filter(p => p && p.id);
    } catch (error) {
        console.error('Error fetching expense data from Google Sheet:', error);
        throw error;
    }
}

export async function addPengeluaranToSheet(item: Pengeluaran): Promise<Pengeluaran> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Pengeluaran'];
        if (!sheet) {
            throw new Error("Worksheet 'Pengeluaran' not found");
        }
        await sheet.addRow(item);
        return item;
    } catch (error) {
        console.error('Error adding new expense to Google Sheet:', error);
        throw error;
    }
}

export async function updatePengeluaranInSheet(item: Partial<Pengeluaran> & { id: string }): Promise<Pengeluaran> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Pengeluaran'];
    if (!sheet) {
        throw new Error("Worksheet 'Pengeluaran' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === item.id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Expense item not found in sheet for update');
    }

    const rowToUpdate = rows[rowIndex];
    for (const key in item) {
        if (key !== 'id' && item.hasOwnProperty(key)) {
            rowToUpdate.set(key, (item as any)[key] || '');
        }
    }
    await rowToUpdate.save();

    const updatedData = { ...rowToUpdate.toObject(), ...item };
    return updatedData as Pengeluaran;
}

export async function deletePengeluaranFromSheet(id: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Pengeluaran'];
    if (!sheet) {
        throw new Error("Worksheet 'Pengeluaran' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Expense item not found in sheet for deletion');
    }

    await rows[rowIndex].delete();
}

// ====== IURAN ======

export async function getIuranDataFromSheet(): Promise<Iuran[]> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Iuran'];
    if (!sheet) {
        console.warn("Worksheet 'Iuran' not found, returning empty array.");
        return [];
    }
    const rows = await sheet.getRows();
    return rows.map(row => ({
        iuranId: row.get('iuranId'),
        wargaId: row.get('wargaId'),
        nama: row.get('nama'),
        bulan: row.get('bulan'),
        tahun: Number(row.get('tahun')),
        iuranLingkungan: Number(row.get('iuranLingkungan')),
        iuranSosial: Number(row.get('iuranSosial')),
        iuranMasjid: Number(row.get('iuranMasjid')),
        totalIuran: Number(row.get('totalIuran')),
        tanggalBayar: row.get('tanggalBayar'),
        status: row.get('status'),
        metodePembayaran: row.get('metodePembayaran'),
        dicatatOleh: row.get('dicatatOleh'),
        buktiUrl: row.get('buktiUrl'),
        keterangan: row.get('keterangan'),
    } as Iuran)).filter(i => i && i.iuranId);
}

export async function addIuranToSheet(item: Omit<Iuran, 'iuranId'>): Promise<Iuran> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Iuran'];
    if (!sheet) {
        throw new Error("Worksheet 'Iuran' not found");
    }
    const newIuran: Iuran = {
        ...item,
        iuranId: `iuran-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };
    await sheet.addRow(newIuran as any);
    return newIuran;
}

export async function updateIuranInSheet(item: Partial<Iuran> & { iuranId: string }): Promise<Iuran> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Iuran'];
    if (!sheet) {
        throw new Error("Worksheet 'Iuran' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('iuranId') === item.iuranId);

    if (rowIndex === -1) {
        throw new Error('Iuran item not found in sheet for update');
    }

    const rowToUpdate = rows[rowIndex];
    for (const key in item) {
        if (key !== 'iuranId' && item.hasOwnProperty(key)) {
            rowToUpdate.set(key, (item as any)[key] ?? '');
        }
    }
    await rowToUpdate.save();

    const updatedData = { ...rowToUpdate.toObject(), ...item };
    return updatedData as Iuran;
}

export async function deleteIuranFromSheet(id: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Iuran'];
    if (!sheet) {
        throw new Error("Worksheet 'Iuran' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('iuranId') === id);

    if (rowIndex === -1) {
        throw new Error('Iuran item not found in sheet for deletion');
    }

    await rows[rowIndex].delete();
}


// ====== PENDAPATAN ======
export async function getPendapatanDataFromSheet(): Promise<Pendapatan[]> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Pendapatan'];
        if (!sheet) {
            console.warn("Worksheet 'Pendapatan' not found, returning empty array.");
            return [];
        }
        const rows = await sheet.getRows();
        return rows.map(row => ({
            id: row.get('id'),
            tanggal: row.get('tanggal'),
            keterangan: row.get('keterangan'),
            nominal: Number(row.get('nominal')) || 0,
            tanggalInput: row.get('tanggalInput'),
        } as Pendapatan)).filter(p => p && p.id);
    } catch (error) {
        console.error('Error fetching pendapatan data from Google Sheet:', error);
        throw error;
    }
}

export async function addPendapatanToSheet(item: Pendapatan): Promise<Pendapatan> {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['Pendapatan'];
        if (!sheet) {
            throw new Error("Worksheet 'Pendapatan' not found");
        }
        await sheet.addRow(item);
        return item;
    } catch (error) {
        console.error('Error adding new pendapatan to Google Sheet:', error);
        throw error;
    }
}

export async function updatePendapatanInSheet(item: Partial<Pendapatan> & { id: string }): Promise<Pendapatan> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Pendapatan'];
    if (!sheet) {
        throw new Error("Worksheet 'Pendapatan' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === item.id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Pendapatan item not found in sheet for update');
    }

    const rowToUpdate = rows[rowIndex];
    for (const key in item) {
        if (key !== 'id' && item.hasOwnProperty(key)) {
            rowToUpdate.set(key, (item as any)[key] || '');
        }
    }
    await rowToUpdate.save();

    const updatedData = { ...rowToUpdate.toObject(), ...item };
    return updatedData as Pendapatan;
}

export async function deletePendapatanFromSheet(id: string): Promise<void> {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Pendapatan'];
    if (!sheet) {
        throw new Error("Worksheet 'Pendapatan' not found");
    }
    const rows = await sheet.getRows();
    const rowIndex = rows.findIndex(row => row.get('id')?.toString().trim() === id?.toString().trim());

    if (rowIndex === -1) {
        throw new Error('Pendapatan item not found in sheet for deletion');
    }

    await rows[rowIndex].delete();
}
