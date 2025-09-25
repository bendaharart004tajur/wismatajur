'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import type { Pendapatan } from '@/lib/types';
import { getPendapatanAction } from '@/app/actions/pendapatan-actions';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";

import { columns } from '@/components/dashboard/pendapatan/columns';
import { DataTable } from '@/components/dashboard/pendapatan/data-table';
import { AddPendapatanDialog } from '@/components/dashboard/pendapatan/add-pendapatan-dialog';
import { TrendingUp } from 'lucide-react';

export default function PendapatanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Pendapatan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendapatan = useCallback(() => {
    if (!user || (user.peran !== 'Admin' && user.peran !== 'Pengawas')) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    getPendapatanAction(user.peran)
      .then(fetchedData => {
        setData(fetchedData);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message || "Gagal memuat data pendapatan.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, toast]);

  useEffect(() => {
    fetchPendapatan();
  }, [fetchPendapatan]);

  // Handle non-admin access
  if (!user || (user.peran !== 'Admin' && user.peran !== 'Pengawas')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <TrendingUp /> Data Pendapatan
          </h1>
          <p className="text-muted-foreground">
            Catatan pendapatan lain-lain di luar iuran warga.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Akses Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Anda tidak memiliki izin untuk mengakses halaman ini. Hanya Admin dan Pengawas yang dapat melihat data pendapatan.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tableColumns = columns(fetchPendapatan, user.peran);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className='flex-1'>
           <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <TrendingUp /> Data Pendapatan
          </h1>
          <p className="text-muted-foreground">
            Catatan semua pendapatan lain-lain yang masuk ke kas RT.
          </p>
        </div>
        {user.peran === 'Admin' && <AddPendapatanDialog onSuccess={fetchPendapatan} />}
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
                <div className='flex justify-between p-4'>
                    <Skeleton className="h-10 w-[250px]" />
                </div>
                <div className='p-4'>
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className='space-y-2 p-4'>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
          ) : (
            <DataTable columns={tableColumns} data={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
