
export type Jabatan = 'Ketua RT' | 'Sekertaris' | 'Bendahara' | 'Koordinator' | 'Humas' | 'Seksi Pembangunan' | 'Seksi Ketahanan Pangan' | 'Seksi Sosial dan Keagamaan' | 'Seksi Keamanan' | 'Warga';
export type Peran = 'Admin' | 'Pengawas' | 'Koordinator' | 'User';
export type Blok = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
export type TipeKegiatan = 'pemasukan' | 'pengeluaran';


export interface User {
  wargaId: string;
  nama: string;
  email: string;
  peran: Peran;
  jabatan: Jabatan;
  blok?: Blok;
  fotoProfil: string;
}

export interface Pengurus {
    id: string;
    wargaId: string;
    nama: string;
    email: string;
    jabatan: Jabatan;
    peran: Peran;
    blok?: Blok;
    password: string; // Hashed password
    tanggalInput: string;
}

export interface Warga {
  wargaId: string;
  nama: string;
  email: string;
  jeniskelamin: string;
  blok: string;
  norumah: string;
  telepon: string; // was phone
  statustempattinggal: string;
  statusktp: string;
  kontakdarurat: string;
  fotoprofilurl: string;
  uploadktpurl: string;
  tanggalinput: string;
  // These were missing from the previous definition but present in forms
  pekerjaan: string;
  statusperkawinan: string;
}

export interface AnggotaKeluarga {
    anggotaId: string;
    wargaId: string;
    nokk: string;
    nama: string;
    hubungan: string;
    jeniskelamin: string;
    tanggallahir: string;
    uploadkkurl: string;
    tanggalinput: string;
}

export interface Iuran {
  iuranId: string;
  wargaId: string;
  nama: string;
  bulan: string;
  tahun: number;
  iuranLingkungan: number;
  iuranSosial: number;
  iuranMasjid: number;
  totalIuran: number;
  tanggalBayar: string;
  status: 'Lunas' | 'Belum Lunas';
  metodePembayaran: 'Tunai' | 'Transfer' | 'E-Wallet';
  dicatatOleh: string;
  buktiUrl?: string;
  keterangan?: string;
  // Optional fields for enriched data
  blok?: string;
  norumah?: string;
}

export interface Pendapatan {
  id: string;
  tanggal: string;
  keterangan: string;
  nominal: number;
  tanggalInput: string;
}

export interface Inventaris {
  id: string;
  namaBarang: string;
  jumlah: number;
  lokasiPenyimpanan: string;
  penanggungJawab: string;
  keterangan?: string; 
  tanggalinput: string;
}

export interface Pengeluaran {
  id: string;
  tanggal: string;
  kategori: string;
  subkategori?: string;
  deskripsi: string;
  jumlah: number;
  metodePembayaran: string;
  buktiUrl?: string;
  dicatatOleh: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  tanggalTerbit: string;
  penulis: string;
  target?: string;
}
