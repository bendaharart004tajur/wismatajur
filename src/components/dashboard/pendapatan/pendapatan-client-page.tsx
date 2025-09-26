'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import type { Pendapatan } from '@/lib/types';
import { getPendapatanAction } from '@/app/actions/pendapatan-actions';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";

import { columns } from '@/components/dashboard/pendapatan/columns';
import { DataTable } from '@/components/dashboard/pendapatan/data-table';
import { AddPendapatanDialog } from '@/components/dashboard/pendapatan/add-pendapatan-dialog';
import { TrendingUp } from 'lucide-react';

interface PendapatanClientPageProps {
  initialData: Pendapatan[];
}

export function PendapatanClientPage({ initialData }: PendapatanClientPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Pendapatan[]>(initialData);
  const [isLoading, setIsLoading] = useState(false); // Only for refresh

  const fetchPendapatan = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    getPendapatanAction(user.peran)
      .then(fetchedData => {
        setData(fetchedData);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message || "Gagal memuat ulang data pendapatan.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, toast]);


  const canAdd = user?.peran === 'Admin';
  const tableColumns = columns(fetchPendapatan, user?.peran);

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
        {canAdd && <AddPendapatanDialog onSuccess={fetchPendapatan} />}
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
