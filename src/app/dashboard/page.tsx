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
                // Fetch all data required for all roles first
                const [allWargaForAdmin, allIuran, pengumuman, allAnggota] = await Promise.all([
                    getWargaAction('Admin', ''), // Fetch all warga for demographic and other stats
                    getIuranAction(user.peran, user.wargaId, user.blok),
                    getPengumumanAction(),
                    getAnggotaKeluargaAction('Admin', '') // Fetch all members for demographics
                ]);
                
                let wargaData: Warga[];
                // Filter warga data based on role for specific cards if needed
                if (user.peran === 'Admin') {
                    wargaData = allWargaForAdmin;
                } else if (user.peran === 'Koordinator') {
                    wargaData = allWargaForAdmin.filter(w => w.blok === user.blok);
                } else {
                    wargaData = allWargaForAdmin.filter(w => w.wargaId === user.wargaId);
                }


                // Admin-specific financial data
                let allPengeluaran: Pengeluaran[] = [];
                let allPendapatan: Pendapatan[] = [];
                if (user.peran === 'Admin') {
                   try {
                     const [pengeluaran, pendapatan] = await Promise.all([
                        getPengeluaranAction(user.peran),
                        getPendapatanAction(user.peran),
                     ]);
                     allPengeluaran = pengeluaran;
                     allPendapatan = pendapatan;

                   } catch (e) {
                    console.error("Gagal mengambil data keuangan:", e);
                   }
                }
                
                const totalUnit = wargaData.length;
                const wargaAktif = wargaData.filter(w => w.nama && w.nama.trim().toLowerCase() !== 'kosong');
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
                const allWargaAktifForDemographics = allWargaForAdmin.filter(w => w.nama && w.nama.trim() !== '' && w.nama.toLowerCase() !== 'kosong');
                const allPenduduk = [
                    ...allWargaAktifForDemographics.map(w => ({ nama: w.nama, jeniskelamin: w.jeniskelamin, blok: w.blok })),
                    ...allAnggota.map(a => {
                        const wargaKepala = allWargaForAdmin.find(w => w.wargaId === a.wargaId);
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

                const iuranBulanIni = allIuran.filter(i => 
                    new Date(i.tanggalBayar).getMonth() === now.getMonth() &&
                    new Date(i.tanggalBayar).getFullYear() === now.getFullYear() &&
                    i.status === 'Lunas'
                );

                const totalNominalIuran = iuranBulanIni.reduce((sum, current) => sum + current.totalIuran, 0);
                const totalLingkungan = iuranBulanIni.reduce((sum, current) => sum + current.iuranLingkungan, 0);
                const totalSosial = iuranBulanIni.reduce((sum, current) => sum + current.iuranSosial, 0);
                const totalMasjid = iuranBulanIni.reduce((sum, current) => sum + current.iuranMasjid, 0);
                
                let iuranLunasCount = 0;
                let iuranPercentage = 0;

                const iuranPeriodeIni = allIuran.filter(i => i.bulan === currentMonthName && i.tahun === currentYear);
                const iuranLunasPeriodeIni = iuranPeriodeIni.filter(i => i.status === 'Lunas');

                if (user.peran === 'Admin') {
                     iuranLunasCount = iuranLunasPeriodeIni.length;
                     const totalWargaTarget = allWargaAktifForDemographics.length;
                     iuranPercentage = totalWargaTarget > 0 ? Math.round((iuranLunasCount / totalWargaTarget) * 100) : 0;
                } else if (user.peran === 'Koordinator') {
                     const wargaDiBlok = allWargaAktifForDemographics.filter(w => w.blok === user.blok).length;
                     iuranLunasCount = iuranLunasPeriodeIni.filter(i => {
                        const warga = allWargaForAdmin.find(w => w.wargaId === i.wargaId);
                        return warga?.blok === user.blok;
                     }).length;
                     iuranPercentage = wargaDiBlok > 0 ? Math.round((iuranLunasCount / wargaDiBlok) * 100) : 0;
                }
                else { // User
                    iuranLunasCount = iuranLunasPeriodeIni.length > 0 ? 1 : 0;
                    iuranPercentage = iuranLunasCount > 0 ? 100 : 0;
                }

                setIuranStats({
                    iuranLunasCount: iuranLunasPeriodeIni.length,
                    iuranPercentage: iuranPercentage,
                    totalNominalIuran: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.totalIuran, 0),
                    totalLingkungan: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranLingkungan, 0),
                    totalSosial: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranSosial, 0),
                    totalMasjid: iuranLunasPeriodeIni.reduce((sum, i) => sum + i.iuranMasjid, 0),
                });

                // Calculate total saldo (Admin only)
                if (user.peran === 'Admin') {
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

                    // Pengeluaran bulan ini
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
                       const iuranBulanIni = allIuran.filter(i => i.bulan === currentMonthName && i.tahun === currentYear && i.status === 'Lunas').reduce((acc, i) => acc + i.totalIuran, 0);
                       const pendapatanLainBulanIni = allPendapatan.filter(p => new Date(p.tanggal).getMonth() === now.getMonth() && new Date(p.tanggal).getFullYear() === now.getFullYear()).reduce((acc, p) => acc + p.nominal, 0);
                       summary[currentMonthKey].pemasukan = iuranBulanIni + pendapatanLainBulanIni;
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
                }


                setStats({
                    pengumumanCount: pengumuman.length,
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
                 {user?.peran === 'Admin' ? (
                    <>
                        <SaldoCard stats={saldoStats} loading={loading} />
                        <WargaStatsCard stats={wargaStats} loading={loading} />
                        <MonthlyIuranCard stats={iuranStats} loading={loading} />
                        <MonthlyPengeluaranCard stats={pengeluaranStats} loading={loading} />
                    </>
                ) : (
                    <>
                        <StatsCard 
                            title="Pengumuman"
                            value={loading ? <Skeleton className="h-8 w-1/2" /> : stats.pengumumanCount.toString()}
                            description={loading ? <Skeleton className="h-4 w-full" /> : "Total pengumuman yang dipublikasikan"}
                            icon={Megaphone}
                        />
                        <WargaStatsCard stats={wargaStats} loading={loading} />
                        <MonthlyIuranCard stats={iuranStats} loading={loading} />
                         <StatsCard 
                            title="Pengeluaran"
                            value={"Hanya Admin"}
                            description={"Total pengeluaran hanya bisa dilihat Admin"}
                            icon={TrendingDown}
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {user?.peran === 'Admin' && <MonthlyFinanceChart data={monthlyChartData} />}
                <DemographicsCard stats={demographicsStats} loading={loading} />
            </div>
        </div>
    )
}

    