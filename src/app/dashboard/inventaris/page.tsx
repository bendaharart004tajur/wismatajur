'use client';
import { useAuth } from '@/context/AuthContext';
import type { Inventaris } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getInventarisAction } from '@/app/actions/inventaris-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { AddInventarisDialog } from '@/components/dashboard/inventaris/add-inventaris-dialog';
import { columns } from '@/components/dashboard/inventaris/columns';
import { DataTable } from '@/components/dashboard/inventaris/data-table';

export default function InventarisPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Inventaris[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInventaris = useCallback(() => {
    setIsLoading(true);
    getInventarisAction()
      .then(data => setData(data))
      .catch(() => {
        toast({
          title: "Error",
          description: "Gagal memuat data inventaris.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchInventaris();
  }, [fetchInventaris]);

  const canPerformActions = user?.peran === 'Admin';
  const tableColumns = columns(fetchInventaris, canPerformActions);
  
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
                <h1 className="text-2xl font-headline font-bold">Data Inventaris</h1>
                <p className="text-muted-foreground">
                  Daftar barang inventaris milik RT 004.
                </p>
            </div>
            {canPerformActions && (
                <AddInventarisDialog onSuccess={fetchInventaris} />
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
