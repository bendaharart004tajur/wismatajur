'use client';

import type { Warga } from '@/lib/types';
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getWargaAction } from '@/app/actions/warga-actions';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddWargaDialog } from '@/components/dashboard/warga/add-warga-dialog';
import { columns } from '@/components/dashboard/warga/columns';
import { DataTable } from '@/components/dashboard/warga/data-table';

interface WargaClientPageProps {
  initialData: Warga[];
}

export function WargaClientPage({ initialData }: WargaClientPageProps) {
  const { user } = useAuth();
  const [data, setData] = useState<Warga[]>(initialData);
  const [loading, setLoading] = useState(false); // No initial loading, just for refresh
  const { toast } = useToast();

  const fetchData = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getWargaAction(user.peran, user.wargaId, user.blok)
        .then(wargaList => {
            setData(wargaList);
        })
        .catch(error => {
            console.error("Failed to fetch warga data:", error);
            toast({ title: "Error", description: "Gagal memuat data warga.", variant: "destructive" });
            setData([]);
        })
        .finally(() => {
            setLoading(false);
        });
  }, [user, toast]);

  const handleWargaUpdated = () => {
    fetchData();
  };

  const tableColumns = columns(fetchData, user?.peran);
  const canPerformActions = user?.peran === 'Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className='flex-1'>
          <h1 className="text-2xl font-headline font-bold">Data Warga</h1>
          <p className="text-muted-foreground">
            Daftar semua warga RT 004 Wisma Tajur.
          </p>
        </div>
        {canPerformActions && (
          <AddWargaDialog onWargaAdded={handleWargaUpdated}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Warga
            </Button>
          </AddWargaDialog>
        )}
      </div>

       <Card>
        <CardContent className="p-0">
          {loading ? (
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
