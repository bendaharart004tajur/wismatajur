'use client';

import { useAuth } from '@/context/AuthContext';
import type { AnggotaKeluargaWithInfo } from '@/app/dashboard/anggota-keluarga/page';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { getAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import { useToast } from '@/hooks/use-toast';
import { AddAnggotaKeluargaDialog } from '@/components/dashboard/add-anggota-keluarga-dialog';
import { columns } from '@/components/dashboard/anggota-keluarga/columns';
import { DataTable } from '@/components/dashboard/anggota-keluarga/data-table';
import { Skeleton } from '@/components/ui/skeleton';

interface AnggotaKeluargaClientPageProps {
    initialData: AnggotaKeluargaWithInfo[];
}

export function AnggotaKeluargaClientPage({ initialData }: AnggotaKeluargaClientPageProps) {
  const { user } = useAuth();
  const [data, setData] = useState<AnggotaKeluargaWithInfo[]>(initialData);
  const [isLoading, setIsLoading] = useState(false); // Only for refresh
  const { toast } = useToast();

  const fetchData = useCallback(() => {
    if (user && (user.peran === 'Admin' || user.peran === 'Pengawas')) {
      setIsLoading(true);
      getAnggotaKeluargaAction(user.peran)
        .then(data => setData(data))
        .catch(err => {
            console.error(err);
            toast({ title: "Error", description: "Gagal memuat ulang data anggota keluarga.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, toast]);

  const canAdd = user?.peran === 'Admin';
  const tableColumns = columns(fetchData, canAdd);
  
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle>Anggota Keluarga</CardTitle>
                        <CardDescription>
                            Daftar semua anggota keluarga dari seluruh warga.
                        </CardDescription>
                    </div>
                    {canAdd && (
                        <AddAnggotaKeluargaDialog onAnggotaAdded={fetchData}>
                            <Button className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Anggota
                            </Button>
                        </AddAnggotaKeluargaDialog>
                    )}
                </div>
            </CardHeader>
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
                    <DataTable columns={tableColumns} data={data} isAdmin={true} />
                )}
            </CardContent>
        </Card>
    </div>
  );
}
