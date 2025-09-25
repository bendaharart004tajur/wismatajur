'use client'
import StatsCard from "@/components/dashboard/stats-card";
import { useAuth } from "@/context/AuthContext";
import { Megaphone, TrendingDown } from "lucide-react";
import MonthlyFinanceChart from "@/components/dashboard/monthly-finance-chart";
import { useEffect, useState } from "react";
import type { Warga, Iuran, Pengumuman, Pengeluaran, Pendapatan, AnggotaKeluarga } from "@/lib/types";
import { getWargaAction } from "@/app/actions/warga-actions";
import { getIuranAction } from "@/app/actions/iuran-actions";
import { getPengeluaranAction } from "@/app/actions/pengeluaran-actions";
import { getPengumumanAction } from "@/app/actions/pengumuman-actions";
import { getPendapatanAction } from "@/app/actions/pendapatan-actions";
import { getAnggotaKeluargaAction } from "@/app/actions/anggota-keluarga-actions";
import { Skeleton } from "@/components/ui/skeleton";
import MonthlyIuranCard, { type MonthlyIuranStats } from "@/components/dashboard/monthly-iuran-card";
import WargaStatsCard, { type WargaStats } from "@/components/dashboard/warga-stats-card";
import SaldoCard, { type SaldoStats } from "@/components/dashboard/saldo-card";
import type { MonthlySummary } from "@/components/dashboard/monthly-finance-chart";
import DemographicsCard, { type DemographicsStats } from "@/components/dashboard/demographics-card";
import MonthlyPengeluaranCard, { type MonthlyPengeluaranStats } from "@/components/dashboard/monthly-pengeluaran-card";


export default function DashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pengumumanCount: 0,
    });
     const [iuranStats, setIuranStats] = useState<MonthlyIuranStats>({
        iuranLunasCount: 0,
        iuranPercentage: 0,
        totalNominalIuran: 0,
        totalLingkungan: 0,
        totalSosial: 0,
        totalMasjid: 0,
    });

    const [wargaStats, setWargaStats] = useState<WargaStats>({
        totalWarga: 0,
        totalUnit: 0,
        byStatusTinggal: {},
    });

     const [demographicsStats, setDemographicsStats] = useState<DemographicsStats>({
        totalPenduduk: 0,
        byJenisKelamin: {},
        byBlok: {},
    });

     const [saldoStats, setSaldoStats] = useState<SaldoStats>({
        totalSaldo: 0,
        totalPemasukan: 0,
        totalPengeluaranKas: 0,
    });
     const [monthlyChartData, setMonthlyChartData] = useState<MonthlySummary[]>([]);
     const [pengeluaranStats, setPengeluaranStats] = useState<MonthlyPengeluaranStats>({
        totalPengeluaran: 0,
        byKategori: {},
     });
    
    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;

            setLoading(true);
            try {
                // Fetch all data required for all roles
                const [
                    allWarga, 
                    allIuran, 
                    allPengumuman, 
                    allAnggota, 
                    allPengeluaran,
                    allPendapatan
                ] = await Promise.all([
                    getWargaAction('Admin', ''), // Always fetch all warga
                    getIuranAction('Admin', ''), // Always fetch all iuran
                    getPengumumanAction(),
                    getAnggotaKeluargaAction('Admin', ''), // Always fetch all members
                    getPengeluaranAction('Admin'), // Always fetch all expenses
                    getPendapatanAction('Admin'), // Always fetch all other income
                ]);
                
                const totalUnit = allWarga.length;
                const wargaAktif = allWarga.filter(w => w.nama && w.nama.trim().toLowerCase() !== 'kosong');
                const byStatusTinggal = wargaAktif.reduce((acc, w) => {
                    const status = w.statustempattinggal || 'Tidak Diketahui';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {} as { [key: string]: number });


                setWargaStats({
                    totalWarga: wargaAktif.length,
                    totalUnit,
                    byStatusTinggal,
                });


                // Demographics Stats for ALL roles
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

                setDemographicsStats({
                    totalPenduduk: allPenduduk.length,
                    byJenisKelamin,
                    byBlok,
                });


                const now = new Date();
                const currentMonthName = now.toLocaleString('id-ID', { month: 'long' });
                const currentYear = now.getFullYear();

                const iuranPeriodeIni = allIuran.filter(i => i.bulan === currentMonthName && i.tahun === currentYear);
                const iuranLunasPeriodeIni = iuranPeriodeIni.filter(i => i.status === 'Lunas');

                const totalWargaTarget = wargaAktif.length;
                const iuranLunasCount = iuranLunasPeriodeIni.length;
                const iuranPercentage = totalWargaTarget > 0 ? Math.round((iuranLunasCount / totalWargaTarget) * 100) : 0;
                
                setIuranStats({
                    iuranLunasCount: iuranLunasCount,
                    iuranPercentage: iuranPercentage,
                    totalNominalIuran: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.totalIuran, 0),
                    totalLingkungan: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranLingkungan, 0),
                    totalSosial: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranSosial, 0),
                    totalMasjid: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranMasjid, 0),
                });
                
                // Pengeluaran bulan ini (for all roles)
                const pengeluaranBulanIni = allPengeluaran.filter(p => new Date(p.tanggal).getMonth() === now.getMonth() && new Date(p.tanggal).getFullYear() === now.getFullYear());
                const totalPengeluaranBulanIni = pengeluaranBulanIni.reduce((acc, p) => acc + p.jumlah, 0);
                const byKategori = pengeluaranBulanIni.reduce((acc, p) => {
                    acc[p.kategori] = (acc[p.kategori] || 0) + p.jumlah;
                    return acc;
                }, {} as {[key: string]: number});

                setPengeluaranStats({
                    totalPengeluaran: totalPengeluaranBulanIni,
                    byKategori,
                });

                // Calculate total saldo 
                const totalPemasukanIuran = allIuran
                    .filter(i => i.status === 'Lunas')
                    .reduce((sum, i) => sum + i.totalIuran, 0);
                
                const totalPemasukanPendapatan = allPendapatan
                    .reduce((sum, p) => sum + p.nominal, 0);

                const totalPemasukan = totalPemasukanIuran + totalPemasukanPendapatan;
                
                const totalPengeluaranKas = allPengeluaran
                    .reduce((sum, p) => sum + p.jumlah, 0);
                
                const totalSaldo = totalPemasukan - totalPengeluaranKas;

                setSaldoStats({
                    totalSaldo,
                    totalPemasukan,
                    totalPengeluaranKas
                });

                // Prepare data for monthly finance chart
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
                
                const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                if (summary[currentMonthKey]) {
                    const iuranBulanIniTotal = allIuran.filter(i => i.bulan === currentMonthName && i.tahun === currentYear && i.status === 'Lunas').reduce((acc, i) => acc + i.totalIuran, 0);
                    const pendapatanLainBulanIni = allPendapatan.filter(p => new Date(p.tanggal).getMonth() === now.getMonth() && new Date(p.tanggal).getFullYear() === now.getFullYear()).reduce((acc, p) => acc + p.nominal, 0);
                    summary[currentMonthKey].pemasukan = iuranBulanIniTotal + pendapatanLainBulanIni;
                }
                
                const chartData = Object.entries(summary).map(([key, value]) => {
                        const [year, monthNum] = key.split('-');
                        const monthName = new Date(Number(year), Number(monthNum) - 1).toLocaleString('id-ID', { month: 'long' });
                        return {
                        month: `${monthName} ${year}`,
                        pemasukan: value.pemasukan,
                        pengeluaran: value.pengeluaran,
                    }
                }).reverse();

                setMonthlyChartData(chartData as MonthlySummary[]);


                setStats({
                    pengumumanCount: allPengumuman.length,
                });

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-headline font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Selamat datang kembali, {user?.nama || 'Pengurus'}!</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SaldoCard stats={saldoStats} loading={loading} />
                <WargaStatsCard stats={wargaStats} loading={loading} />
                <MonthlyIuranCard stats={iuranStats} loading={loading} />
                <MonthlyPengeluaranCard stats={pengeluaranStats} loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MonthlyFinanceChart data={monthlyChartData} />
                <DemographicsCard stats={demographicsStats} loading={loading} />
            </div>
        </div>
    )
}

    
