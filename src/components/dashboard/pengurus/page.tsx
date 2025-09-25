'use client';
import { useAuth } from '@/context/AuthContext';
import type { Pengurus } from '@/lib/types';
import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddPengurusDialog } from '@/components/dashboard/add-pengurus-dialog';
import { EditPengurusDialog } from '@/components/dashboard/edit-pengurus-dialog';
import { DeletePengurusAlert } from '@/components/dashboard/delete-pengurus-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getPengurusAction } from '@/app/actions/pengurus-actions';

type PengurusWithoutPassword = Omit<Pengurus, 'password'>;

export default function PengurusPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PengurusWithoutPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPengurus, setSelectedPengurus] = useState<PengurusWithoutPassword | null>(null);
  const [deletePengurusId, setDeletePengurusId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = async () => {
    if (user?.peran !== 'Admin') return;
    setLoading(true);
    try {
      const pengurusList = await getPengurusAction();
      setData(pengurusList);
    } catch (error) {
      console.error("Failed to fetch pengurus data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchData();
    }
  }, [user]);

  const handlePengurusAddedOrUpdated = () => {
    startTransition(() => {
      fetchData();
    });
  };

  const handlePengurusDeleted = (id: string) => {
     startTransition(() => {
       fetchData(); 
    });
  };

  const openEditDialog = (pengurus: PengurusWithoutPassword) => {
    setSelectedPengurus(pengurus);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletePengurusId(id);
    setIsDeleteDialogOpen(true);
  };

  if (user?.peran !== 'Admin') {
    return (
      <Card>
        <CardHeader><CardTitle>Akses Ditolak</CardTitle></CardHeader>
        <CardContent><p>Anda tidak memiliki izin untuk melihat halaman ini.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Data Pengurus RT</h1>
          <p className="text-muted-foreground">Daftar pengurus RT 004 Wisma Tajur.</p>
        </div>
         <AddPengurusDialog onPengurusAdded={handlePengurusAddedOrUpdated}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengurus
          </Button>
        </AddPengurusDialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Jabatan</TableHead>
                  <TableHead className="hidden md:table-cell">Peran</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : data.length > 0 ? data.map((pengurus) => (
                  <TableRow key={pengurus.id}>
                    <TableCell className="font-medium">
                      {pengurus.nama}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{pengurus.jabatan}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={pengurus.peran === 'Admin' ? 'default' : 'secondary'}>{pengurus.peran}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{pengurus.email}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(pengurus)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(pengurus.id)} className="text-destructive">Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">Tidak ada data untuk ditampilkan.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedPengurus && (
        <EditPengurusDialog
          pengurus={selectedPengurus}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onPengurusUpdated={handlePengurusAddedOrUpdated}
        />
      )}

      {deletePengurusId && (
        <DeletePengurusAlert
          pengurusId={deletePengurusId}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onPengurusDeleted={handlePengurusDeleted}
        />
      )}
    </div>
  );
}
