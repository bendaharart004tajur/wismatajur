'use client';

import { AnggotaKeluarga } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { deleteAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import { EditAnggotaKeluargaDialog } from '../edit-anggota-keluarga-dialog';
import type { AnggotaKeluargaWithInfo } from '@/app/dashboard/anggota-keluarga/page';


function AksiKolom({ item, refreshData }: { item: AnggotaKeluargaWithInfo, refreshData: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDeletePending, startDeleteTransition] = useTransition();
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleDelete = () => {
        if (!user || user.peran !== 'Admin') return;
        startDeleteTransition(async () => {
          const result = await deleteAnggotaKeluargaAction(user.peran, item.anggotaId);
          if (result.success) {
            toast({ title: 'Sukses', description: result.message });
            refreshData(); 
          } else {
            toast({ title: 'Gagal', description: result.message, variant: 'destructive' });
          }
          setIsAlertOpen(false);
        });
    };

    if (user?.peran !== 'Admin') {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <EditAnggotaKeluargaDialog anggota={item} onAnggotaUpdated={refreshData}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            Edit
                        </DropdownMenuItem>
                    </EditAnggotaKeluargaDialog>
                    <DropdownMenuItem onSelect={() => setIsAlertOpen(true)} className="text-destructive focus:text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data anggota keluarga <span className="font-semibold">{item.nama}</span> secara permanen.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeletePending} className="bg-destructive hover:bg-destructive/90">
                        {isDeletePending ? 'Menghapus...' : 'Ya, Hapus'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export const columns = (refreshData: () => void, isAdmin: boolean): ColumnDef<AnggotaKeluargaWithInfo>[] => {
    
    return [
        {
            accessorKey: 'kepalaKeluarga',
            header: 'Kepala Keluarga',
        },
        {
            accessorKey: 'alamat',
            header: 'Alamat',
        },
        {
            accessorKey: 'nama',
            header: 'Nama',
            cell: ({ row }) => <div className="font-medium">{row.getValue('nama')}</div>
        },
        {
            accessorKey: 'nokk',
            header: 'No. KK',
        },
        {
            accessorKey: 'hubungan',
            header: 'Hubungan',
            cell: ({ row }) => <div className="hidden md:table-cell">{row.getValue('hubungan')}</div>
        },
        {
            accessorKey: 'jeniskelamin',
            header: 'Jenis Kelamin',
             cell: ({ row }) => <div className="hidden lg:table-cell">{row.getValue('jeniskelamin')}</div>
        },
        {
            accessorKey: 'tanggallahir',
            header: 'Tanggal Lahir',
            cell: ({ row }) => {
                const date = new Date(row.getValue('tanggallahir'));
                const formatted = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                return <div className="hidden sm:table-cell whitespace-nowrap">{formatted}</div>
            }
        },
        {
            accessorKey: 'uploadkkurl',
            header: 'KK',
            cell: ({ row }) => {
                const url = row.getValue('uploadkkurl') as string;
                if (!url) return null;
                return (
                    <Button variant="outline" size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">Lihat</a>
                    </Button>
                )
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                if (!isAdmin) return null;
                const item = row.original;
                return <AksiKolom item={item} refreshData={refreshData} />;
            },
            enableHiding: false,
        },
    ]
};
