'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import {
  getPengumumanDataFromSheet,
  addPengumumanToSheet,
  updatePengumumanInSheet,
  deletePengumumanFromSheet
} from '@/lib/google-sheets';
import type { Pengumuman, Peran } from '@/lib/types';

// Action to get all announcements
export async function getPengumumanAction(): Promise<Pengumuman[]> {
  try {
    const data = await getPengumumanDataFromSheet();
    // Sort by date, newest first
    return data.sort((a, b) => new Date(b.tanggalTerbit).getTime() - new Date(a.tanggalTerbit).getTime());
  } catch (error) {
    console.error('Error in getPengumumanAction:', error);
    throw new Error('Gagal mengambil data pengumuman.');
  }
}

// Action to add a new announcement
export async function addPengumumanAction(peran: Peran, penulis: string, item: Omit<Pengumuman, 'id' | 'tanggalTerbit' | 'penulis'>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menambah data.' };
    }
    try {
        const newPengumuman: Pengumuman = {
            ...item,
            id: randomUUID(),
            tanggalTerbit: new Date().toISOString(),
            penulis: penulis,
        };
        await addPengumumanToSheet(newPengumuman);
        revalidatePath('/dashboard/pengumuman');
        return { success: true, message: 'Pengumuman berhasil ditambahkan.' };
    } catch (error) {
        console.error('Error in addPengumumanAction:', error);
        return { success: false, message: 'Gagal menambahkan pengumuman.' };
    }
}

// Action to update an existing announcement
export async function updatePengumumanAction(peran: Peran, id: string, item: Partial<Omit<Pengumuman, 'id'>>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat mengubah data.' };
    }
    try {
        await updatePengumumanInSheet({ ...item, id });
        revalidatePath('/dashboard/pengumuman');
        return { success: true, message: 'Pengumuman berhasil diperbarui.' };
    } catch (error) {
        console.error('Error in updatePengumumanAction:', error);
        return { success: false, message: 'Gagal memperbarui pengumuman.' };
    }
}

// Action to delete an announcement
export async function deletePengumumanAction(peran: Peran, id: string) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menghapus data.' };
    }
    try {
        await deletePengumumanFromSheet(id);
        revalidatePath('/dashboard/pengumuman');
        return { success: true, message: 'Pengumuman berhasil dihapus.' };
    } catch (error) {
        console.error('Error in deletePengumumanAction:', error);
        return { success: false, message: 'Gagal menghapus pengumuman.' };
    }
}
