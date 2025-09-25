'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import type { Pengeluaran } from '@/lib/types';
import { getPengeluaranAction } from '@/app/actions/pengeluaran-actions';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";

import { columns } from '@/components/dashboard/pengeluaran/columns';
import { DataTable } from '@/components/dashboard/pengeluaran/data-table';
import { AddPengeluaranDialog } from '@/components/dashboard/pengeluaran/add-pengeluaran-dialog';

export default function PengeluaranPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Pengeluaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPengeluaran = useCallback(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    getPengeluaranAction(user.peran)
      .then(fetchedData => {
        setData(fetchedData);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message || "Gagal memuat data pengeluaran.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, toast]);

  useEffect(() => {
    fetchPengeluaran();
  }, [fetchPengeluaran]);

  const tableColumns = columns(fetchPengeluaran, user?.peran === 'Admin');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className='flex-1'>
          <h1 className="text-2xl font-headline font-bold">Data Pengeluaran</h1>
          <p className="text-muted-foreground">
            Daftar semua transaksi pengeluaran kas RT yang tercatat.
          </p>
        </div>
        {user?.peran === 'Admin' && <AddPengeluaranDialog onSuccess={fetchPengeluaran} />}
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
