'use client';

import { Inventaris } from '@/lib/types';
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
import { EditInventarisDialog } from './edit-inventaris-dialog';
import { DeleteInventarisDialog } from './delete-inventaris-dialog';

function AksiKolom({ item, refreshData }: { item: Inventaris, refreshData: () => void }) {
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
                <EditInventarisDialog item={item} onSuccess={refreshData}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditInventarisDialog>
                <DeleteInventarisDialog item={item} onSuccess={refreshData}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DeleteInventarisDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const columns = (refreshData: () => void, isAdmin: boolean): ColumnDef<Inventaris>[] => {
    const baseColumns: ColumnDef<Inventaris>[] = [
        {
            accessorKey: 'namaBarang',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Nama Barang
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="font-medium">
                        <div>{item.namaBarang}</div>
                        {item.keterangan && <div className="text-sm text-muted-foreground">{item.keterangan}</div>}
                    </div>
                );
            }
        },
        {
            accessorKey: 'jumlah',
            header: 'Jumlah',
            cell: ({ row }) => <div className="text-center">{row.getValue('jumlah')}</div>
        },
        {
            accessorKey: 'lokasiPenyimpanan',
            header: 'Lokasi',
        },
        {
            accessorKey: 'penanggungJawab',
            header: 'Penanggung Jawab',
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
