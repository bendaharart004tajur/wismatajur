'use client';

import { Pengumuman } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { EditPengumumanDialog } from './edit-pengumuman-dialog';
import { DeletePengumumanDialog } from './delete-pengumuman-dialog';

function AksiKolom({ item, refreshData }: { item: Pengumuman, refreshData: () => void }) {
    return (
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
                <EditPengumumanDialog item={item} onSuccess={refreshData}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditPengumumanDialog>
                <DeletePengumumanDialog item={item} onSuccess={refreshData}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DeletePengumumanDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const columns = (refreshData: () => void, isAdmin: boolean): ColumnDef<Pengumuman>[] => {
    const baseColumns: ColumnDef<Pengumuman>[] = [
        {
            accessorKey: 'judul',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Judul
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="font-medium pl-2">
                        <div>{item.judul}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">{item.isi}</div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'tanggalTerbit',
            header: 'Tanggal Terbit',
            cell: ({ row }) => {
                const date = new Date(row.getValue('tanggalTerbit'));
                const formatted = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                return <span>{formatted}</span>;
            }
        },
        {
            accessorKey: 'penulis',
            header: 'Penulis',
        },
        {
            accessorKey: 'target',
            header: 'Target',
        },
    ];

    if (isAdmin) {
        baseColumns.push({
            id: 'actions',
            cell: ({ row }) => {
                const item = row.original;
                return <AksiKolom item={item} refreshData={refreshData} />;
            },
            enableHiding: false,
        });
    }
    
    return baseColumns;
};
