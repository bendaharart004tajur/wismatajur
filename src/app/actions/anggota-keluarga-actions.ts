
'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import {
  getAnggotaKeluargaDataFromSheet,
  addAnggotaKeluargaToSheet,
  updateAnggotaKeluargaInSheet,
  deleteAnggotaKeluargaFromSheet,
  getWargaDataFromSheet,
} from '@/lib/google-sheets';
import type { AnggotaKeluarga, Peran } from '@/lib/types';


export type AnggotaKeluargaWithInfo = AnggotaKeluarga & {
  kepalaKeluarga?: string;
  alamat?: string;
};

export async function getAnggotaKeluargaAction(): Promise<AnggotaKeluargaWithInfo[]> {
  try {
      const allAnggota = await getAnggotaKeluargaDataFromSheet();
      const allWarga = await getWargaDataFromSheet();
      
      const wargaMap = new Map(allWarga.map(w => [w.wargaId, {
        nama: w.nama,
        alamat: `Blok ${w.blok}/${w.norumah}`,
      }]));
      
      const enrichedAnggota = allAnggota.map(anggota => {
        const wargaInfo = wargaMap.get(anggota.wargaId);
        return {
            ...anggota,
            kepalaKeluarga: wargaInfo?.nama || 'Tidak Diketahui',
            alamat: wargaInfo?.alamat || '-',
        }
      });
      return enrichedAnggota;

  } catch (error) {
    console.error('Error in getAnggotaKeluargaAction:', error);
    throw new Error('Failed to fetch anggota keluarga data.');
  }
}

export async function addAnggotaKeluargaAction(
    peran: Peran,
    wargaId: string, 
    anggota: Omit<AnggotaKeluarga, 'anggotaId' | 'tanggalinput' | 'wargaId'>
) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menambahkan data.' };
    }
    try {
        const newAnggota: AnggotaKeluarga = {
            ...anggota,
            wargaId: wargaId,
            anggotaId: randomUUID(),
            tanggalinput: new Date().toISOString(),
        };
        await addAnggotaKeluargaToSheet(newAnggota);
        revalidatePath('/dashboard/anggota-keluarga');
        return { success: true, message: 'Anggota keluarga berhasil ditambahkan.' };
    } catch (error) {
        console.error('Error in addAnggotaKeluargaAction:', error);
        return { success: false, message: 'Gagal menambahkan anggota keluarga.' };
    }
}

export async function updateAnggotaKeluargaAction(peran: Peran, anggota: Partial<AnggotaKeluarga> & { anggotaId: string }) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat memperbarui data.' };
    }
    try {
        await updateAnggotaKeluargaInSheet(anggota);
        revalidatePath('/dashboard/anggota-keluarga');
        return { success: true, message: 'Data anggota keluarga berhasil diperbarui.' };
    } catch (error) {
        console.error('Error in updateAnggotaKeluargaAction:', error);
        return { success: false, message: 'Gagal memperbarui data anggota keluarga.' };
    }
}

export async function deleteAnggotaKeluargaAction(peran: Peran, anggotaId: string) {
    if (peran !== 'Admin') {
        return { success: false, message: 'Akses ditolak: Hanya Admin yang dapat menghapus data.' };
    }
    try {
        await deleteAnggotaKeluargaFromSheet(anggotaId);
        revalidatePath('/dashboard/anggota-keluarga');
        return { success: true, message: 'Anggota keluarga berhasil dihapus.' };
    } catch (error) {
        console.error('Error in deleteAnggotaKeluargaAction:', error);
        return { success: false, message: 'Gagal menghapus anggota keluarga.' };
    }
}
