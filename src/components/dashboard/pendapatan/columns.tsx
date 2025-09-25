'use client';

import { Pendapatan, Peran } from '@/lib/types';
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
import { EditPendapatanDialog } from './edit-pendapatan-dialog';
import { DeletePendapatanDialog } from './delete-pendapatan-dialog';


function AksiKolom({ item, refreshData }: { item: Pendapatan, refreshData: () => void }) {
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
                <EditPendapatanDialog item={item} onSuccess={refreshData}>
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditPendapatanDialog>
                <DeletePendapatanDialog item={item} onSuccess={refreshData}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DeletePendapatanDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const columns = (refreshData: () => void, userRole?: Peran): ColumnDef<Pendapatan>[] => {
    
    const baseColumns: ColumnDef<Pendapatan>[] = [
    {
        accessorKey: 'tanggal',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Tanggal
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue('tanggal'));
            if (isNaN(date.getTime())) {
                return <div className="font-medium">-</div>;
            }
            const formatted = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            return <div className="pl-4 font-medium">{formatted}</div>
        }
    },
    {
        accessorKey: 'keterangan',
        header: 'Keterangan',
        cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue('keterangan')}</div>
    },
    {
        accessorKey: 'nominal',
        header: () => <div className="text-right">Nominal</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('nominal'));
            if (isNaN(amount)) {
                return <div className="text-right font-mono pr-4">-</div>;
            }

            const formatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
            
            return <div className="text-right font-mono pr-4">{formatted}</div>
        }
    },
    {
        accessorKey: 'tanggalInput',
        header: 'Tgl. Input',
        cell: ({ row }) => {
            const date = new Date(row.getValue('tanggalInput'));
            if (isNaN(date.getTime())) {
                return <div>-</div>;
            }
            const formatted = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            return <div>{formatted}</div>
        }
    },
    ];

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
