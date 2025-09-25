'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import {
  getInventarisDataFromSheet,
  addInventarisToSheet,
  updateInventarisInSheet,
  deleteInventarisFromSheet
} from '@/lib/google-sheets';
import type { Inventaris, Peran } from '@/lib/types';

// Action to get all inventaris items
export async function getInventarisAction(): Promise<Inventaris[]> {
  try {
    const data = await getInventarisDataFromSheet();
    return data;
  } catch (error) {
    console.error('Error in getInventarisAction:', error);
    return [];
  }
}

// Action to add a new inventaris item
export async function addInventarisAction(peran: Peran, item: Omit<Inventaris, 'id' | 'tanggalinput'>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menambah data.' };
    }
    try {
        const newItem: Inventaris = {
            ...item,
            id: randomUUID(),
            jumlah: Number(item.jumlah) || 0,
            tanggalinput: new Date().toISOString(),
        };
        await addInventarisToSheet(newItem);
        revalidatePath('/dashboard/inventaris');
        return { success: true, message: 'Barang inventaris berhasil ditambahkan.' };
    } catch (error) {
        console.error('Error in addInventarisAction:', error);
        return { success: false, message: 'Gagal menambahkan barang inventaris.' };
    }
}

// Action to update an existing inventaris item
export async function updateInventarisAction(peran: Peran, id: string, item: Partial<Omit<Inventaris, 'id' | 'tanggalinput'>>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat mengubah data.' };
    }
    try {
        if (item.jumlah) {
            item.jumlah = Number(item.jumlah) || 0;
        }
        await updateInventarisInSheet({ ...item, id });
        revalidatePath('/dashboard/inventaris');
        return { success: true, message: 'Barang inventaris berhasil diperbarui.' };
    } catch (error) {
        console.error('Error in updateInventarisAction:', error);
        return { success: false, message: 'Gagal memperbarui barang inventaris.' };
    }
}

// Action to delete an inventaris item
export async function deleteInventarisAction(peran: Peran, id: string) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menghapus data.' };
    }
    try {
        await deleteInventarisFromSheet(id);
        revalidatePath('/dashboard/inventaris');
        return { success: true, message: 'Barang inventaris berhasil dihapus.' };
    } catch (error) {
        console.error('Error in deleteInventarisAction:', error);
        return { success: false, message: 'Gagal menghapus barang inventaris.' };
    }
}
