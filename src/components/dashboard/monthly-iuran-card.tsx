'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Wallet } from "lucide-react";

export interface MonthlyIuranStats {
    iuranLunasCount: number;
    iuranPercentage: number;
    totalNominalIuran: number;
    totalLingkungan: number;
    totalSosial: number;
    totalMasjid: number;
}

interface MonthlyIuranCardProps {
    stats: MonthlyIuranStats;
    loading: boolean;
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};


const StatRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center text-xs">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-mono text-foreground">{value}</p>
    </div>
);


export default function MonthlyIuranCard({ stats, loading }: MonthlyIuranCardProps) {
    if (loading) {
        return (
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Iuran Bulan Ini</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-full" />
                    <Separator className="my-2" />
                    <div className="space-y-2">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Iuran Bulan Ini</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.iuranPercentage}% Lunas</div>
                <p className="text-xs text-muted-foreground">
                    {formatRupiah(stats.totalNominalIuran)} terkumpul dari {stats.iuranLunasCount} warga
                </p>
                <Separator className="my-2" />
                <div className="space-y-1">
                    <StatRow label="Lingkungan" value={formatRupiah(stats.totalLingkungan)} />
                    <StatRow label="Sosial" value={formatRupiah(stats.totalSosial)} />
                    <StatRow label="Masjid" value={formatRupiah(stats.totalMasjid)} />
                </div>
            </CardContent>
        </Card>
    );
}
