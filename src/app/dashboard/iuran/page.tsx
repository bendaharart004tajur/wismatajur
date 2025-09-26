
'use client';
import { useAuth } from '@/context/AuthContext';
import type { Iuran } from '@/lib/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { id as localeId } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { getIuranAction } from '@/app/actions/iuran-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { AddIuranDialog } from '@/components/dashboard/iuran/add-iuran-dialog';
import { columns } from '@/components/dashboard/iuran/columns';
import { DataTable } from '@/components/dashboard/iuran/data-table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface GroupedIuran {
  [month: string]: {
    items: Iuran[];
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

  const groupedData = useMemo(() => {
    const bulanMapping = {
      "Januari": 0, "Februari": 1, "Maret": 2, "April": 3, "Mei": 4, "Juni": 5,
      "Juli": 6, "Agustus": 7, "September": 8, "Oktober": 9, "November": 10, "Desember": 11
    };

    return data.reduce((acc, item) => {
      const monthKey = `${item.bulan} ${item.tahun}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { items: [], total: 0 };
      }
      acc[monthKey].items.push(item);
      if (item.status === 'Lunas') {
        acc[monthKey].total += item.totalIuran;
      }
      return acc;
    }, {} as GroupedIuran);
  }, [data]);
  
  const sortedMonthKeys = useMemo(() => {
     const bulanMapping = {
      "Januari": 0, "Februari": 1, "Maret": 2, "April": 3, "Mei": 4, "Juni": 5,
      "Juli": 6, "Agustus": 7, "September": 8, "Oktober": 9, "November": 10, "Desember": 11
    };
    return Object.keys(groupedData).sort((a, b) => {
        const [bulanA, tahunA] = a.split(' ');
        const [bulanB, tahunB] = b.split(' ');
        const dateA = new Date(parseInt(tahunA), bulanMapping[bulanA as keyof typeof bulanMapping]);
        const dateB = new Date(parseInt(tahunB), bulanMapping[bulanB as keyof typeof bulanMapping]);
        return dateB.getTime() - dateA.getTime();
    });
  }, [groupedData]);


  const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const currentMonthKey = `${currentMonthName} ${currentYear}`;

  const canPerformActions = user?.peran === 'Admin';
  const tableColumns = columns(fetchIuran, canPerformActions);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-headline font-bold">Data Iuran Warga</h1>
          <p className="text-muted-foreground">
            Daftar catatan pembayaran iuran warga, dikelompokkan per bulan.
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
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : sortedMonthKeys.length > 0 ? (
                  <Accordion type="single" collapsible defaultValue={currentMonthKey} className="w-full">
                     {sortedMonthKeys.map((month) => {
                        const group = groupedData[month];
                        return (
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
                        )
                    })}
                  </Accordion>
                ) : (
                  <div className='text-center p-12 text-muted-foreground'>
                      Tidak ada data iuran untuk ditampilkan.
                  </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
