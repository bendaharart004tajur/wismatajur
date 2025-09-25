'use server';

import { revalidatePath } from 'next/cache';
import type { Pengurus } from '@/lib/types';
import {
  addPengurusToSheet,
  updatePengurusInSheet,
  deletePengurusFromSheet,
  getPengurusDataFromSheet,
} from '@/lib/google-sheets';

// Action to get all pengurus
export async function getPengurusAction(): Promise<Omit<Pengurus, 'password'>[]> {
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
    
    if (!data.email) {
        throw new Error('Email is required for a new pengurus.');
    }
    
    // Check if email already exists
    const existingPengurus = await getPengurusDataFromSheet();
    if (existingPengurus.some(p => p.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain.', data: null };
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

    // Check if email is being changed and if the new one already exists
    if (data.email) {
        const allPengurus = await getPengurusDataFromSheet();
        const existingPengurusWithEmail = allPengurus.find(p => p.email.toLowerCase() === data.email!.toLowerCase());
        if (existingPengurusWithEmail && existingPengurusWithEmail.id !== data.id) {
            return { success: false, message: 'Email sudah digunakan oleh pengurus lain.', data: null };
        }
    }


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
