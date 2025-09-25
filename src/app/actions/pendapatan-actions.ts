'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import {
  getPendapatanDataFromSheet,
  addPendapatanToSheet,
  updatePendapatanInSheet,
  deletePendapatanFromSheet,
} from '@/lib/google-sheets'; // Corrected import path
import type { Pendapatan, Peran } from '@/lib/types';

// Action to get all income records
export async function getPendapatanAction(peran: Peran): Promise<Pendapatan[]> {
  if (peran !== 'Admin') {
    return [];
  }
  try {
    const data = await getPendapatanDataFromSheet();
    return data.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  } catch (error) {
    console.error('Error in getPendapatanAction:', error);
    throw new Error('Gagal mengambil data pendapatan.');
  }
}

// Action to add a new income record
export async function addPendapatanAction(peran: Peran, item: Omit<Pendapatan, 'id' | 'tanggalInput'>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menambah data.' };
    }
    try {
        const newPendapatan: Pendapatan = {
            ...item,
            id: randomUUID(),
            tanggalInput: new Date().toISOString(),
        };
        await addPendapatanToSheet(newPendapatan);
        revalidatePath('/dashboard/pendapatan');
        return { success: true, message: 'Catatan pendapatan berhasil ditambahkan.' };
    } catch (error) {
        console.error('Error in addPendapatanAction:', error);
        return { success: false, message: 'Gagal menambahkan pendapatan.' };
    }
}

// Action to update an existing income record
export async function updatePendapatanAction(peran: Peran, id: string, item: Partial<Omit<Pendapatan, 'id' | 'tanggalInput'>>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat mengubah data.' };
    }
    try {
        if (item.nominal) {
            item.nominal = Number(item.nominal) || 0;
        }
        await updatePendapatanInSheet({ ...item, id });
        revalidatePath('/dashboard/pendapatan');
        return { success: true, message: 'Catatan pendapatan berhasil diperbarui.' };
    } catch (error) {
        console.error('Error in updatePendapatanAction:', error);
        return { success: false, message: 'Gagal memperbarui pendapatan.' };
    }
}

// Action to delete an income record
export async function deletePendapatanAction(peran: Peran, id: string) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menghapus data.' };
    }
    try {
        await deletePendapatanFromSheet(id);
        revalidatePath('/dashboard/pendapatan');
        return { success: true, message: 'Catatan pendapatan berhasil dihapus.' };
    } catch (error) {
        console.error('Error in deletePendapatanAction:', error);
        return { success: false, message: 'Gagal menghapus pendapatan.' };
    }
}
