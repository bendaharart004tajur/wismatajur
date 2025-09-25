'use server';

import { revalidatePath } from 'next/cache';
import type { Pengurus } from '@/lib/types';
import {
  addPengurusToSheet,
  updatePengurusInSheet,
  deletePengurusFromSheet,
  getPengurusDataFromSheet,
} from '@/services/google-sheet';

// Action to get all pengurus
export async function getPengurusAction(): Promise<Pengurus[]> {
    try {
        // We get the full data on the server, but we won't expose passwords to the client.
        const pengurusList = await getPengurusDataFromSheet();
        return pengurusList.map(({ password, ...rest }) => rest);
    } catch (error) {
        console.error("Error in getPengurusAction:", error);
        return [];
    }
}

// The 'data' parameter reflects the form data.
// It's missing properties which we will generate on the server.
type AddPengurusData = Omit<Pengurus, 'id' | 'tanggalInput' | 'password'> & { password?: string };

// Action to add a new pengurus
export async function addPengurusAction(data: AddPengurusData): Promise<{ success: boolean; message: string; data: Omit<Pengurus, 'password'> | null }> {
  try {
    if (!data.password) {
      throw new Error('Password is required for a new pengurus.');
    }

    // The ID and timestamp are generated here, and password will be hashed in the service layer.
    const newPengurusData: Pengurus = {
      ...data,
      id: `p-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6)}`,
      tanggalInput: new Date().toISOString(),
      password: data.password, // Pass the plain password to the service layer for hashing
    };
    
    const addedPengurus = await addPengurusToSheet(newPengurusData);
    
    revalidatePath('/dashboard/pengurus');

    // Return data without the password
    const { password, ...safeData } = addedPengurus;
    return { success: true, message: 'Pengurus baru berhasil ditambahkan.', data: safeData };
  } catch (error: any) {
    return { success: false, message: `Gagal menambahkan pengurus: ${error.message}`, data: null };
  }
}


// Action to update a pengurus
export async function updatePengurusAction(
  data: Partial<Pengurus> & { id: string; password?: string }
): Promise<{ success: boolean; message: string; data: Omit<Pengurus, 'password'> | null }> {
  try {
    const updatedPengurus = await updatePengurusInSheet(data);
    revalidatePath('/dashboard/pengurus');
    
    // Return data without the password
    const { password, ...safeData } = updatedPengurus;
    return { success: true, message: 'Data pengurus berhasil diperbarui.', data: safeData };
  } catch (error: any) {
    return { success: false, message: `Gagal memperbarui data pengurus: ${error.message}`, data: null };
  }
}

// Action to delete a pengurus
export async function deletePengurusAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    await deletePengurusFromSheet(id);
    revalidatePath('/dashboard/pengurus');
    return { success: true, message: 'Data pengurus berhasil dihapus.' };
  } catch (error: any) {
    return { success: false, message: `Gagal menghapus data pengurus: ${error.message}` };
  }
}
