'use client';

import { Warga, Peran } from '@/lib/types';
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
import { Badge } from '@/components/ui/badge';
import { EditWargaDialog } from './edit-warga-dialog';
import { DeleteWargaAlert } from './delete-warga-alert';
import { useAuth } from '@/context/AuthContext';

function AksiKolom({ item, refreshData }: { item: Warga, refreshData: () => void }) {
    const { user } = useAuth();
    if (user?.peran !== 'Admin') return null;

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
                <EditWargaDialog warga={item} onWargaUpdated={refreshData}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditWargaDialog>
                <DeleteWargaAlert warga={item} onWargaDeleted={refreshData}>
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DeleteWargaAlert>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const columns = (refreshData: () => void, userRole?: Peran): ColumnDef<Warga>[] => {
    const baseColumns: ColumnDef<Warga>[] = [
    {
        accessorKey: 'nama',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Nama
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('nama')}</div>
    },
    {
        accessorKey: 'blok',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Blok/No
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const warga = row.original;
            return `${warga.blok}/${warga.norumah}`;
        }
    },
    {
        accessorKey: 'statustempattinggal',
        header: 'Status Huni',
        cell: ({ row }) => {
            const status = row.getValue('statustempattinggal') as string;
             return <Badge variant={status === 'Tetap' ? 'default' : 'secondary'}>{status}</Badge>;
        }
    },
     {
        accessorKey: 'statusktp',
        header: 'Status KTP',
        cell: ({ row }) => {
            const status = row.getValue('statusktp') as string;
            return <Badge variant={status === 'Local' ? 'default' : 'secondary'}>{status}</Badge>;
        }
    },
    {
        accessorKey: 'phone',
        header: 'No. Telepon',
    },
    ]

    if (userRole === 'Admin') {
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
