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
import type { AnggotaKeluarga, Peran, Warga } from '@/lib/types';
import type { AnggotaKeluargaWithInfo } from '@/app/dashboard/anggota-keluarga/page';


export async function getAnggotaKeluargaAction(peran: Peran, wargaId: string): Promise<AnggotaKeluargaWithInfo[]> {
  try {
      const allAnggota = await getAnggotaKeluargaDataFromSheet();
      const allWarga = await getWargaDataFromSheet('Admin', '');
      
      const wargaMap = new Map(allWarga.map(w => [w.wargaId, {
        nama: w.nama,
        alamat: `Blok ${w.blok}/${w.norumah}`,
        blok: w.blok,
        wargaData: w
      }]));

    if (peran === 'Admin' || peran === 'Pengawas') {
      const enrichedAnggota = allAnggota.map(anggota => {
        const wargaInfo = wargaMap.get(anggota.wargaId);
        return {
            ...anggota,
            kepalaKeluarga: wargaInfo?.nama || 'Tidak Diketahui',
            alamat: wargaInfo?.alamat || '-',
        }
      });
      return enrichedAnggota;
    } 
    
    // For Koordinator and User, filter first, then enrich
    let filteredAnggota: AnggotaKeluarga[];

    if (peran === 'Koordinator') {
        const userWarga = allWarga.find(w => w.wargaId === wargaId);
        const blokKoordinator = userWarga?.blok;
        
        if (!blokKoordinator) return [];

        const wargaDiBlok = new Set(allWarga.filter(w => w.blok === blokKoordinator).map(w => w.wargaId));
        filteredAnggota = allAnggota.filter(a => wargaDiBlok.has(a.wargaId));
    
    } else { // User
      filteredAnggota = allAnggota.filter(a => a.wargaId === wargaId);
    }
    
    return filteredAnggota.map(anggota => {
        const wargaInfo = wargaMap.get(anggota.wargaId);
        return {
            ...anggota,
            kepalaKeluarga: wargaInfo?.nama || 'Tidak Diketahui',
            alamat: wargaInfo?.alamat || '-',
        }
    });

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