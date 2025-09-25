'use client';
import { useAuth } from '@/context/AuthContext';
import type { Iuran } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getIuranAction } from '@/app/actions/iuran-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { AddIuranDialog } from '@/components/dashboard/iuran/add-iuran-dialog';
import { columns } from '@/components/dashboard/iuran/columns';
import { DataTable } from '@/components/dashboard/iuran/data-table';


export default function IuranPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Iuran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchIuran = useCallback(() => {
    if (user) {
      setIsLoading(true);
      getIuranAction(user.peran, user.wargaId, user.blok)
        .then(data => setData(data))
        .catch((err) => {
          toast({
            title: "Error",
            description: err.message || "Gagal memuat data iuran.",
            variant: "destructive",
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, toast]);

  useEffect(() => {
    fetchIuran();
  }, [fetchIuran]);

  const canPerformActions = user?.peran === 'Admin';
  const tableColumns = columns(fetchIuran, canPerformActions);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-headline font-bold">Data Iuran Warga</h1>
          <p className="text-muted-foreground">
            Daftar catatan pembayaran iuran warga.
          </p>
        </div>
        {user?.peran === 'Admin' && (
            <AddIuranDialog onSuccess={fetchIuran} />
        )}
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
