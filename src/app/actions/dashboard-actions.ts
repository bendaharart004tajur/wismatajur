'use server';

import type { Warga, Iuran, Pengumuman, Pengeluaran, Pendapatan, AnggotaKeluarga, Peran } from "@/lib/types";
import type { WargaStats } from "@/components/dashboard/warga-stats-card";
import type { MonthlyIuranStats } from "@/components/dashboard/monthly-iuran-card";
import type { DemographicsStats } from "@/components/dashboard/demographics-card";
import type { SaldoStats } from "@/components/dashboard/saldo-card";
import type { MonthlyPengeluaranStats } from "@/components/dashboard/monthly-pengeluaran-card";
import type { MonthlySummary } from "@/components/dashboard/monthly-finance-chart";

import { getWargaAction } from "@/app/actions/warga-actions";
import { getIuranAction } from "@/app/actions/iuran-actions";
import { getPengeluaranAction } from "@/app/actions/pengeluaran-actions";
import { getPengumumanAction } from "@/app/actions/pengumuman-actions";
import { getPendapatanAction } from "@/app/actions/pendapatan-actions";
import { getAnggotaKeluargaAction } from "@/app/actions/anggota-keluarga-actions";


export interface DashboardStats {
    wargaStats: WargaStats;
    iuranStats: MonthlyIuranStats;
    demographicsStats: DemographicsStats;
    saldoStats: SaldoStats;
    pengeluaranStats: MonthlyPengeluaranStats;
    monthlyChartData: MonthlySummary[];
}


export async function getDashboardStatsAction(peran: Peran, wargaId: string, blok?: string): Promise<DashboardStats> {
    try {
        const [
            allWarga, 
            allIuran, 
            allPengumuman, 
            allAnggota, 
            allPengeluaran,
            allPendapatan
        ] = await Promise.all([
            getWargaAction('Admin', ''), // Always fetch all warga for calculations
            getIuranAction('Admin', ''),   // Always fetch all iuran for calculations
            getPengumumanAction(),
            getAnggotaKeluargaAction('Admin', ''), // Always fetch all members for calculations
            getPengeluaranAction('Admin'), // Always fetch all expenses for calculations
            getPendapatanAction('Admin'),  // Always fetch all other income for calculations
        ]);

        // Warga Stats
        const totalUnit = allWarga.length;
        const wargaAktif = allWarga.filter(w => w.nama && w.nama.trim().toLowerCase() !== 'kosong');
        const byStatusTinggal = wargaAktif.reduce((acc, w) => {
            const status = w.statustempattinggal || 'Tidak Diketahui';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const wargaStats: WargaStats = {
            totalWarga: wargaAktif.length,
            totalUnit,
            byStatusTinggal,
        };

        // Demographics Stats
        const allPenduduk = [
            ...wargaAktif.map(w => ({ nama: w.nama, jeniskelamin: w.jeniskelamin, blok: w.blok })),
            ...allAnggota.map(a => {
                const wargaKepala = allWarga.find(w => w.wargaId === a.wargaId);
                return {
                    nama: a.nama,
                    jeniskelamin: a.jeniskelamin,
                    blok: wargaKepala?.blok || 'N/A'
                };
            })
        ].filter(p => p.nama && p.nama.trim() !== '' && p.nama.toLowerCase() !== 'kosong');
        
        const byJenisKelamin = allPenduduk.reduce((acc, p) => {
            const jk = p.jeniskelamin || 'Lainnya';
            acc[jk] = (acc[jk] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});
        
        const byBlok = allPenduduk.reduce((acc, p) => {
            const blok = p.blok || 'N/A';
            acc[blok] = (acc[blok] || 0) + 1;
            return acc;
        }, {} as {[key: string]: number});

        const demographicsStats: DemographicsStats = {
            totalPenduduk: allPenduduk.length,
            byJenisKelamin,
            byBlok,
        };

        // Iuran Stats (for current month)
        const now = new Date();
        const currentMonthName = now.toLocaleString('id-ID', { month: 'long' });
        const currentYear = now.getFullYear();

        const iuranPeriodeIni = allIuran.filter(i => i.bulan === currentMonthName && i.tahun === currentYear);
        const iuranLunasPeriodeIni = iuranPeriodeIni.filter(i => i.status === 'Lunas');

        const totalWargaTarget = wargaAktif.length;
        const iuranLunasCount = iuranLunasPeriodeIni.length;
        const iuranPercentage = totalWargaTarget > 0 ? Math.round((iuranLunasCount / totalWargaTarget) * 100) : 0;
        
        const iuranStats: MonthlyIuranStats = {
            iuranLunasCount: iuranLunasCount,
            iuranPercentage: iuranPercentage,
            totalNominalIuran: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.totalIuran, 0),
            totalLingkungan: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranLingkungan, 0),
            totalSosial: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranSosial, 0),
            totalMasjid: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranMasjid, 0),
        };

        // Pengeluaran Stats (for current month)
        const pengeluaranBulanIni = allPengeluaran.filter(p => new Date(p.tanggal).getMonth() === now.getMonth() && new Date(p.tanggal).getFullYear() === now.getFullYear());
        const totalPengeluaranBulanIni = pengeluaranBulanIni.reduce((acc, p) => acc + p.jumlah, 0);
        const byKategori = pengeluaranBulanIni.reduce((acc, p) => {
            acc[p.kategori] = (acc[p.kategori] || 0) + p.jumlah;
            return acc;
        }, {} as {[key: string]: number});

        const pengeluaranStats: MonthlyPengeluaranStats = {
            totalPengeluaran: totalPengeluaranBulanIni,
            byKategori,
        };

        // Saldo Stats
        const totalPemasukanIuran = allIuran.filter(i => i.status === 'Lunas').reduce((sum, i) => sum + i.totalIuran, 0);
        const totalPemasukanPendapatan = allPendapatan.reduce((sum, p) => sum + p.nominal, 0);
        const totalPemasukan = totalPemasukanIuran + totalPemasukanPendapatan;
        const totalPengeluaranKas = allPengeluaran.reduce((sum, p) => sum + p.jumlah, 0);
        const totalSaldo = totalPemasukan - totalPengeluaranKas;

        const saldoStats: SaldoStats = {
            totalSaldo,
            totalPemasukan,
            totalPengeluaranKas
        };

        // Monthly Chart Data
        const summary: { [key: string]: { pemasukan: number; pengeluaran: number } } = {};
        const N_MONTHS = 6;
        for (let i = 0; i < N_MONTHS; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            summary[monthKey] = { pemasukan: 0, pengeluaran: 0 };
        }

        allIuran.forEach(iuran => {
            if (iuran.status === 'Lunas') {
                const d = new Date(iuran.tanggalBayar);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (summary[monthKey]) {
                    summary[monthKey].pemasukan += iuran.totalIuran;
                }
            }
        });

        allPendapatan.forEach(p => {
            const d = new Date(p.tanggal);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (summary[monthKey]) {
                summary[monthKey].pemasukan += p.nominal;
            }
        });

        allPengeluaran.forEach(p => {
            const d = new Date(p.tanggal);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (summary[monthKey]) {
                summary[monthKey].pengeluaran += p.jumlah;
            }
        });
        
        const monthlyChartData = Object.entries(summary).map(([key, value]) => {
                const [year, monthNum] = key.split('-');
                const monthName = new Date(Number(year), Number(monthNum) - 1).toLocaleString('id-ID', { month: 'long' });
                return {
                month: `${monthName.substring(0, 3)} ${year.slice(-2)}`,
                pemasukan: value.pemasukan,
                pengeluaran: value.pengeluaran,
            }
        }).reverse();

        return {
            wargaStats,
            iuranStats,
            demographicsStats,
            saldoStats,
            pengeluaranStats,
            monthlyChartData,
        };

    } catch (error) {
        console.error("Failed to fetch and process dashboard stats:", error);
        throw new Error("Gagal memuat statistik dashboard.");
    }
}
