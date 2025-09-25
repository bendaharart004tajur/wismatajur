'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import {
  getPengeluaranDataFromSheet,
  addPengeluaranToSheet,
  updatePengeluaranInSheet,
  deletePengeluaranFromSheet
} from '@/lib/google-sheets'; // Corrected import path
import type { Pengeluaran, Peran } from '@/lib/types';

interface PengeluaranInput extends Omit<Pengeluaran, 'id' | 'dicatatOleh' | 'tanggal'> {
  tanggal: string; // Expect ISO string from client
}

// Action to get all expenses, restricted to Admins
export async function getPengeluaranAction(peran: Peran): Promise<Pengeluaran[]> {
  // Allow all roles to view, but only admin can edit/delete through UI
  try {
    const data = await getPengeluaranDataFromSheet();
    // Sort by date, newest first
    return data.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  } catch (error) {
    console.error('Error in getPengeluaranAction:', error);
    throw new Error('Gagal mengambil data pengeluaran.');
  }
}

// Action to add a new expense
export async function addPengeluaranAction(peran: Peran, dicatatOleh: string, item: Omit<PengeluaranInput, 'id' | 'dicatatOleh'>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menambah data.' };
    }
    try {
        const newPengeluaran: Pengeluaran = {
            ...item,
            id: randomUUID(),
            dicatatOleh: dicatatOleh,
        };
        await addPengeluaranToSheet(newPengeluaran);
        revalidatePath('/dashboard/pengeluaran');
        return { success: true, message: 'Pengeluaran berhasil ditambahkan.' };
    } catch (error) {
        console.error('Error in addPengeluaranAction:', error);
        return { success: false, message: 'Gagal menambahkan pengeluaran.' };
    }
}

// Action to update an existing expense
export async function updatePengeluaranAction(peran: Peran, id: string, item: Omit<PengeluaranInput, 'id' | 'dicatatOleh'>) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat mengubah data.' };
    }
    try {
        // Ensure the ID is not lost during update
        const updatedData = { ...item, id };
        await updatePengeluaranInSheet(updatedData);
        revalidatePath('/dashboard/pengeluaran');
        return { success: true, message: 'Pengeluaran berhasil diperbarui.' };
    } catch (error) {
        console.error('Error in updatePengeluaranAction:', error);
        return { success: false, message: 'Gagal memperbarui pengeluaran.' };
    }
}

// Action to delete an expense
export async function deletePengeluaranAction(peran: Peran, id: string) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menghapus data.' };
    }
    try {
        await deletePengeluaranFromSheet(id);
        revalidatePath('/dashboard/pengeluaran');
        return { success: true, message: 'Pengeluaran berhasil dihapus.' };
    } catch (error) {
        console.error('Error in deletePengeluaranAction:', error);
        return { success: false, message: 'Gagal menghapus pengeluaran.' };
    }
}
