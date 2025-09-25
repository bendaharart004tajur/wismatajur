'use client';
import { useAuth } from '@/context/AuthContext';
import type { Pengumuman } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPengumumanAction } from '@/app/actions/pengumuman-actions';
import { useToast } from "@/hooks/use-toast";
import { AddPengumumanDialog } from '@/components/dashboard/pengumuman/add-pengumuman-dialog';
import { columns } from '@/components/dashboard/pengumuman/columns';
import { DataTable } from '@/components/dashboard/pengumuman/data-table';


export default function PengumumanPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Pengumuman[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPengumuman = useCallback(() => {
    setIsLoading(true);
    getPengumumanAction()
      .then(data => setData(data))
      .catch(() => {
        toast({
          title: "Error",
          description: "Gagal memuat data pengumuman.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  useEffect(() => {
    fetchPengumuman();
  }, [fetchPengumuman]);

  const tableColumns = columns(fetchPengumuman, user?.peran === 'Admin');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-headline font-bold">Pengumuman</h1>
          <p className="text-muted-foreground">
            Informasi dan pengumuman penting untuk warga.
          </p>
        </div>
        {user?.peran === 'Admin' && (
            <AddPengumumanDialog onSuccess={fetchPengumuman} />
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
