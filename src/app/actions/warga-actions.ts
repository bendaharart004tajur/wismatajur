'use server';

import { revalidatePath } from 'next/cache';
import { addWargaToSheet, deleteWargaFromSheet, getWargaDataFromSheet, updateWargaInSheet } from '@/lib/google-sheets';
import type { Peran, Warga } from '@/lib/types';

export async function getWargaAction(peran: Peran, wargaId?: string, blok?: string) {
  try {
    const warga = await getWargaDataFromSheet(peran, wargaId, blok);
    return warga;
  } catch (error) {
    console.error('Error in getWargaAction:', error);
    throw new Error('Gagal mengambil data warga.');
  }
}

export async function getWargaListForAnggotaKeluargaAction() {
  try {
    // Memanggil dengan peran 'Admin' untuk mendapatkan semua data
    const allWarga = await getWargaDataFromSheet('Admin'); 
    // Memilih hanya field yang diperlukan
    return allWarga.map(w => ({ 
      wargaId: w.wargaId,
      nama: w.nama,
      blok: w.blok,
      norumah: w.norumah
    }));
  } catch (error) {
    console.error('Error in getWargaListForAnggotaKeluargaAction:', error);
    return []; // Return empty array on error
  }
}

export async function addWargaAction(warga: Omit<Warga, 'wargaId' | 'tanggalinput'>) {
    try {
        const newWarga = await addWargaToSheet(warga);
        revalidatePath('/dashboard/warga');
        return {
            success: true,
            message: 'Warga berhasil ditambahkan.',
            data: newWarga
        };
    } catch (error) {
        console.error('Error in addWargaAction:', error);
        return {
            success: false,
            message: 'Gagal menambahkan warga. Penyebab: ' + (error instanceof Error ? error.message : String(error)),
        };
    }
}

export async function updateWargaAction(warga: Partial<Warga> & { wargaId: string }) {
    try {
        const updatedWarga = await updateWargaInSheet(warga);
        revalidatePath('/dashboard/warga');
        return {
            success: true,
            message: 'Data warga berhasil diperbarui.',
            data: updatedWarga
        };
    } catch (error) {
        console.error('Error in updateWargaAction:', error);
        return {
            success: false,
            message: 'Gagal memperbarui data warga. Penyebab: ' + (error instanceof Error ? error.message : String(error)),
        };
    }
}

export async function deleteWargaAction(peran: Peran, wargaId: string) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menghapus data.' };
    }
    try {
        await deleteWargaFromSheet(wargaId);
        revalidatePath('/dashboard/warga');
        return {
            success: true,
            message: 'Data warga berhasil dihapus.',
        };
    } catch (error) {
        console.error('Error in deleteWargaAction:', error);
        return {
            success: false,
            message: 'Gagal menghapus data warga. Penyebab: ' + (error instanceof Error ? error.message : String(error)),
        };
    }
}
