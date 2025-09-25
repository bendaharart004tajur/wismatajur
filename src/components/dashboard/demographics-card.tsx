'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Users, User, PersonStanding } from "lucide-react";

export interface DemographicsStats {
    totalPenduduk: number;
    byJenisKelamin: { [key: string]: number };
    byBlok: { [key: string]: number };
}

interface DemographicsCardProps {
    stats: DemographicsStats;
    loading: boolean;
}

const StatRow = ({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
    <div className="flex justify-between items-center text-xs">
        <p className="text-muted-foreground flex items-center gap-2">
            {Icon && <Icon className="h-3 w-3" />}
            {label}
        </p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

export default function DemographicsCard({ stats, loading }: DemographicsCardProps) {
    if (loading) {
        return (
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Demografi Penduduk</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
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
                <CardTitle className="text-sm font-medium">Demografi Penduduk</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalPenduduk}</div>
                <p className="text-xs text-muted-foreground">
                    Total penduduk terdaftar
                </p>
                <Separator className="my-2" />
                <div className="space-y-1">
                    <StatRow label="Laki-laki" value={stats.byJenisKelamin['Laki-laki'] || 0} icon={User} />
                    <StatRow label="Perempuan" value={stats.byJenisKelamin['Perempuan'] || 0} icon={PersonStanding} />
                </div>
                <Separator className="my-2" />
                 <div className="space-y-1">
                    {Object.entries(stats.byBlok)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([blok, count]) => (
                            <StatRow key={blok} label={`Blok ${blok}`} value={count} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
