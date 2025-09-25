'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Home } from "lucide-react";

export interface WargaStats {
    totalWarga: number;
    totalUnit: number;
    byStatusTinggal: { [key: string]: number };
}

interface WargaStatsCardProps {
    stats: WargaStats;
    loading: boolean;
}

const StatRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center text-xs">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

export default function WargaStatsCard({ stats, loading }: WargaStatsCardProps) {
    if (loading) {
        return (
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Warga Aktif</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
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
                <CardTitle className="text-sm font-medium">Total Warga Aktif</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalWarga}</div>
                <p className="text-xs text-muted-foreground">
                    dari total {stats.totalUnit} unit terdata
                </p>
                <Separator className="my-2" />
                <div className="space-y-1">
                    {Object.entries(stats.byStatusTinggal).map(([status, count]) => (
                        <StatRow key={status} label={status} value={count} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

    