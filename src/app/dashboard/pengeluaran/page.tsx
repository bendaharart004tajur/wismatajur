'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import type { Pengeluaran } from '@/lib/types';
import { getPengeluaranAction } from '@/app/actions/pengeluaran-actions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { columns } from '@/components/dashboard/pengeluaran/columns';
import { DataTable } from '@/components/dashboard/pengeluaran/data-table';
import { AddPengeluaranDialog } from '@/components/dashboard/pengeluaran/add-pengeluaran-dialog';

interface GroupedPengeluaran {
  [month: string]: {
    items: Pengeluaran[];
    total: number;
  };
}

const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};


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

  const groupedData = useMemo(() => {
    return data.reduce((acc, item) => {
      const monthKey = format(new Date(item.tanggal), 'MMMM yyyy', { locale: id });
      if (!acc[monthKey]) {
        acc[monthKey] = { items: [], total: 0 };
      }
      acc[monthKey].items.push(item);
      acc[monthKey].total += item.jumlah;
      return acc;
    }, {} as GroupedPengeluaran);
  }, [data]);

  // Get current month to be opened by default in accordion
  const currentMonthKey = format(new Date(), 'MMMM yyyy', { locale: id });

  const tableColumns = columns(fetchPengeluaran, user?.peran === 'Admin');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className='flex-1'>
          <h1 className="text-2xl font-headline font-bold">Data Pengeluaran</h1>
          <p className="text-muted-foreground">
            Daftar semua transaksi pengeluaran kas RT yang tercatat, dikelompokkan per bulan.
          </p>
        </div>
        {user?.peran === 'Admin' && <AddPengeluaranDialog onSuccess={fetchPengeluaran} />}
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          ) : Object.keys(groupedData).length > 0 ? (
            <Accordion type="single" collapsible defaultValue={currentMonthKey} className="w-full">
              {Object.entries(groupedData).map(([month, group]) => (
                <AccordionItem value={month} key={month}>
                  <AccordionTrigger className="px-6">
                    <div className="flex justify-between w-full pr-4">
                      <span className='font-bold text-lg'>{month}</span>
                      <span className='font-semibold font-mono text-muted-foreground'>{formatRupiah(group.total)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t">
                     <DataTable columns={tableColumns} data={group.items} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className='text-center p-12 text-muted-foreground'>
                Tidak ada data pengeluaran untuk ditampilkan.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
