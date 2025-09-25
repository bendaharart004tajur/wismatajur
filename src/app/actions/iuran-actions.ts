'use server';

import { revalidatePath } from 'next/cache';
import type { Peran, Iuran, Warga } from '@/lib/types';
import {
  addIuranToSheet,
  deleteIuranFromSheet,
  getIuranDataFromSheet,
  getWargaDataFromSheet,
  updateIuranInSheet,
} from '@/services/google-sheet';

export async function getIuranAction(peran: Peran, wargaId: string, blok?: string) {
  try {
    const allIuran = await getIuranDataFromSheet();
    const allWarga = await getWargaDataFromSheet('Admin'); // Always get all warga for enrichment
    
    const wargaMap = new Map(allWarga.map(w => [w.wargaId, {
      blok: w.blok,
      norumah: w.norumah,
    }]));

    const enrichedIuran = allIuran.map(iuran => {
      const wargaInfo = wargaMap.get(iuran.wargaId);
      return {
        ...iuran,
        blok: wargaInfo?.blok,
        norumah: wargaInfo?.norumah,
      }
    });

    let filteredIuran: Iuran[];

    if (peran === 'Admin') {
      filteredIuran = enrichedIuran;
    } else if (peran === 'Koordinator' && blok) {
      filteredIuran = enrichedIuran.filter(iuran => iuran.blok === blok);
    } else if (peran === 'User') {
      filteredIuran = enrichedIuran.filter(iuran => iuran.wargaId === wargaId);
    } else {
      filteredIuran = [];
    }
    
    return filteredIuran.sort((a, b) => new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime());

  } catch (error) {
    console.error('Error in getIuranAction:', error);
    throw new Error('Gagal mengambil data iuran.');
  }
}

export async function addBulkIuranAction(
  peran: Peran,
  item: Omit<Iuran, 'iuranId' | 'bulan' | 'tahun'> & { startBulan: string; endBulan: string; tahun: number }
) {
  if (peran !== 'Admin') {
    return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menambah data.' };
  }
  try {
    const bulanOptions = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const startIndex = bulanOptions.indexOf(item.startBulan);
    const endIndex = bulanOptions.indexOf(item.endBulan);

    if (startIndex === -1 || endIndex === -1) {
      return { success: false, message: 'Bulan awal atau akhir tidak valid.' };
    }

    const iuranToCreate: Omit<Iuran, 'iuranId'>[] = [];
    let currentYear = item.tahun;
    let currentIndex = startIndex;

    // Loop until we pass the end month and year combination.
    while (true) {
        const currentMonth = bulanOptions[currentIndex];
        
        iuranToCreate.push({
            ...item,
            bulan: currentMonth,
            tahun: currentYear,
        });

        // Break condition: current month and year match the end month and year.
        // The year check depends on whether the end month index is smaller than the start month index,
        // which implies a year transition.
        const targetYear = endIndex < startIndex ? item.tahun + 1 : item.tahun;
        if (currentYear === targetYear && currentIndex === endIndex) {
            break;
        }

        // Increment month index
        currentIndex++;
        
        // If we've passed December, reset to January and increment the year
        if (currentIndex >= bulanOptions.length) {
            currentIndex = 0;
            currentYear++;
        }

        // Safety break to prevent excessively long ranges (e.g., max 24 months)
        if (iuranToCreate.length > 24) {
            return { success: false, message: "Rentang bulan terlalu panjang (maksimal 24 bulan)." };
        }
    }


    for (const singleIuran of iuranToCreate) {
      await addIuranToSheet(singleIuran);
    }

    revalidatePath('/dashboard/iuran');
    return { success: true, message: `Berhasil menambahkan ${iuranToCreate.length} catatan iuran.` };

  } catch (error) {
    console.error('Error in addBulkIuranAction:', error);
    return { success: false, message: 'Gagal menambahkan catatan iuran secara massal.' };
  }
}


export async function addIuranAction(peran: Peran, item: Omit<Iuran, 'iuranId'>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menambah data.' };
    }
    try {
        await addIuranToSheet(item);
        revalidatePath('/dashboard/iuran');
        return { success: true, message: 'Catatan iuran berhasil ditambahkan.' };
    } catch (error) {
        console.error('Error in addIuranAction:', error);
        return { success: false, message: 'Gagal menambahkan catatan iuran.' };
    }
}

export async function updateIuranAction(peran: Peran, iuranId: string, item: Partial<Omit<Iuran, 'iuranId'>>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat mengubah data.' };
    }
    try {
        await updateIuranInSheet({ ...item, iuranId });
        revalidatePath('/dashboard/iuran');
        return { success: true, message: 'Catatan iuran berhasil diperbarui.' };
    } catch (error) {
        console.error('Error in updateIuranAction:', error);
        return { success: false, message: 'Gagal memperbarui catatan iuran.' };
    }
}

export async function deleteIuranAction(peran: Peran, iuranId: string) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menghapus data.' };
    }
    try {
        await deleteIuranFromSheet(iuranId);
        revalidatePath('/dashboard/iuran');
        return { success: true, message: 'Catatan iuran berhasil dihapus.' };
    } catch (error) {
        console.error('Error in deleteIuranAction:', error);
        return { success: false, message: 'Gagal menghapus catatan iuran.' };
    }
}
