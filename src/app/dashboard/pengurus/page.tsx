'use client';
import { useAuth } from '@/context/AuthContext';
import type { Pengurus } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

import { getPengurusAction } from '@/app/actions/pengurus-actions';
import { useToast } from "@/hooks/use-toast";

import { columns } from '@/components/dashboard/pengurus/columns';
import { DataTable } from '@/components/dashboard/pengurus/data-table';
import { AddPengurusDialog } from '@/components/dashboard/add-pengurus-dialog';
import { Skeleton } from '@/components/ui/skeleton';

type PengurusWithoutPassword = Omit<Pengurus, 'password'>;


export default function PengurusPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PengurusWithoutPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchData = useCallback(() => {
    if (user?.peran !== 'Admin') {
        setLoading(false);
        return;
    };
    setLoading(true);
    getPengurusAction()
        .then(pengurusList => {
            setData(pengurusList);
        })
        .catch(error => {
            console.error("Failed to fetch pengurus data:", error);
            toast({ title: "Error", description: "Gagal memuat data pengurus.", variant: "destructive" });
            setData([]);
        })
        .finally(() => {
            setLoading(false);
        });
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (user?.peran !== 'Admin') {
    return (
      <Card>
        <CardHeader><CardTitle>Akses Ditolak</CardTitle></CardHeader>
        <CardContent><p>Anda tidak memiliki izin untuk melihat halaman ini.</p></CardContent>
      </Card>
    );
  }

  const tableColumns = columns(fetchData);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Data Pengurus RT</h1>
          <p className="text-muted-foreground">Daftar pengurus RT 004 Wisma Tajur.</p>
        </div>
         <AddPengurusDialog onPengurusAdded={fetchData}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengurus
          </Button>
        </AddPengurusDialog>
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
