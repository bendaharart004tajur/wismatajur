'use client';

import { useAuth } from '@/context/AuthContext';
import type { AnggotaKeluargaWithInfo } from '@/app/actions/anggota-keluarga-actions';
import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { getAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import { useToast } from '@/hooks/use-toast';
import { AddAnggotaKeluargaDialog } from '@/components/dashboard/add-anggota-keluarga-dialog';
import { columns } from '@/components/dashboard/anggota-keluarga/columns';
import { DataTable } from '@/components/dashboard/anggota-keluarga/data-table';
import { Skeleton } from '@/components/ui/skeleton';


export default function AnggotaKeluargaPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnggotaKeluargaWithInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(() => {
    if (!user || (user.peran !== 'Admin' && user.peran !== 'Pengawas')) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    getAnggotaKeluargaAction()
      .then(data => setData(data))
      .catch(err => {
          console.error(err);
          toast({ title: "Error", description: "Gagal memuat data anggota keluarga.", variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) {
    return (
        <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    );
  }

  if (user.peran !== 'Admin' && user.peran !== 'Pengawas') {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Akses Ditolak</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            </CardContent>
        </Card>
    );
  }

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
                    <DataTable columns={tableColumns} data={data} isAdmin={canAdd} />
                )}
            </CardContent>
        </Card>
    </div>
  );
}
