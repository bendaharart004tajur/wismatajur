'use client';

import { useAuth } from '@/context/AuthContext';
import type { AnggotaKeluarga } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { getAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AddAnggotaKeluargaDialog } from '@/components/dashboard/add-anggota-keluarga-dialog';
import { columns } from '@/components/dashboard/anggota-keluarga/columns';
import { DataTable } from '@/components/dashboard/anggota-keluarga/data-table';


// Enriched type for the table
export type AnggotaKeluargaWithInfo = AnggotaKeluarga & { 
    kepalaKeluarga?: string;
    alamat?: string;
};


export default function AnggotaKeluargaPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnggotaKeluargaWithInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(() => {
    if (user) {
      setIsLoading(true);
      getAnggotaKeluargaAction(user.peran, user.wargaId)
        .then(data => setData(data))
        .catch(err => {
            console.error(err);
            toast({ title: "Error", description: "Gagal memuat data anggota keluarga.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tableColumns = columns(fetchData, user?.peran === 'Admin');
  
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle>Anggota Keluarga</CardTitle>
                        <CardDescription>
                            {user?.peran === 'Admin' || user?.peran === 'Pengawas' ? 
                            'Daftar semua anggota keluarga dari seluruh warga.' :
                            'Daftar anggota keluarga yang terdaftar atas nama Anda.'} 
                        </CardDescription>
                    </div>
                    {user?.peran === 'Admin' && (
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
                    <DataTable columns={tableColumns} data={data} isAdmin={user?.peran === 'Admin' || user?.peran === 'Pengawas'} />
                )}
            </CardContent>
        </Card>
    </div>
  );
}
