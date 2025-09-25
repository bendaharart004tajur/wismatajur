'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Banknote } from "lucide-react";

export interface SaldoStats {
    totalSaldo: number;
    totalPemasukan: number;
    totalPengeluaranKas: number;
}

interface SaldoCardProps {
    stats: SaldoStats;
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


const StatRow = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className="flex justify-between items-center text-xs">
        <p className="text-muted-foreground">{label}</p>
        <p className={`font-mono ${className}`}>{value}</p>
    </div>
);


export default function SaldoCard({ stats, loading }: SaldoCardProps) {
    if (loading) {
        return (
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Saldo Kas</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-full" />
                    <Separator className="my-2" />
                    <div className="space-y-2">
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
                <CardTitle className="text-sm font-medium">Total Saldo Kas</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatRupiah(stats.totalSaldo)}</div>
                <p className="text-xs text-muted-foreground">
                    Posisi kas RT saat ini
                </p>
                <Separator className="my-2" />
                <div className="space-y-1">
                    <StatRow label="Pemasukan" value={formatRupiah(stats.totalPemasukan)} className="text-green-600"/>
                    <StatRow label="Pengeluaran" value={formatRupiah(stats.totalPengeluaranKas)} className="text-red-600" />
                </div>
            </CardContent>
        </Card>
    );
}
