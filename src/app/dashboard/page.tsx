'use client'
import StatsCard from "@/components/dashboard/stats-card";
import { useAuth } from "@/context/AuthContext";
import { Megaphone, TrendingDown } from "lucide-react";
import MonthlyFinanceChart from "@/components/dashboard/monthly-finance-chart";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MonthlyIuranCard, { type MonthlyIuranStats } from "@/components/dashboard/monthly-iuran-card";
import WargaStatsCard, { type WargaStats } from "@/components/dashboard/warga-stats-card";
import SaldoCard, { type SaldoStats } from "@/components/dashboard/saldo-card";
import type { MonthlySummary } from "@/components/dashboard/monthly-finance-chart";
import DemographicsCard, { type DemographicsStats } from "@/components/dashboard/demographics-card";
import MonthlyPengeluaranCard, { type MonthlyPengeluaranStats } from "@/components/dashboard/monthly-pengeluaran-card";
import { getDashboardStatsAction, type DashboardStats } from "@/app/actions/dashboard-actions";


export default function DashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    
    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;

            setLoading(true);
            try {
                const dashboardStats = await getDashboardStatsAction(user.peran, user.wargaId, user.blok);
                setStats(dashboardStats);
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

    const emptyWargaStats: WargaStats = { totalWarga: 0, totalUnit: 0, byStatusTinggal: {} };
    const emptyIuranStats: MonthlyIuranStats = { iuranLunasCount: 0, iuranPercentage: 0, totalNominalIuran: 0, totalLingkungan: 0, totalSosial: 0, totalMasjid: 0 };
    const emptyDemographicsStats: DemographicsStats = { totalPenduduk: 0, byJenisKelamin: {}, byBlok: {} };
    const emptySaldoStats: SaldoStats = { totalSaldo: 0, totalPemasukan: 0, totalPengeluaranKas: 0 };
    const emptyPengeluaranStats: MonthlyPengeluaranStats = { totalPengeluaran: 0, byKategori: {} };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-headline font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Selamat datang kembali, {user?.nama || 'Pengurus'}!</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SaldoCard stats={stats?.saldoStats ?? emptySaldoStats} loading={loading} />
                <WargaStatsCard stats={stats?.wargaStats ?? emptyWargaStats} loading={loading} />
                <MonthlyIuranCard stats={stats?.iuranStats ?? emptyIuranStats} loading={loading} />
                <MonthlyPengeluaranCard stats={stats?.pengeluaranStats ?? emptyPengeluaranStats} loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MonthlyFinanceChart data={stats?.monthlyChartData ?? []} />
                <DemographicsCard stats={stats?.demographicsStats ?? emptyDemographicsStats} loading={loading} />
            </div>
        </div>
    )
}

    
