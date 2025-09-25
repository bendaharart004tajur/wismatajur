'use client';

import { Pengeluaran } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, FileText } from 'lucide-react';

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

import { EditPengeluaranDialog } from './edit-pengeluaran-dialog';
import { DeletePengeluaranDialog } from './delete-pengeluaran-dialog';
import { ViewBuktiDialog } from './view-bukti-dialog';

function AksiKolom({ item, refreshData }: { item: Pengeluaran, refreshData: () => void }) {
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
                <EditPengeluaranDialog item={item} onSuccess={refreshData}>
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditPengeluaranDialog>
                <DeletePengeluaranDialog item={item} onSuccess={refreshData}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DeletePengeluaranDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const columns = (refreshData: () => void, isAdmin: boolean): ColumnDef<Pengeluaran>[] => {
    
    const baseColumns: ColumnDef<Pengeluaran>[] = [
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
            return <div className="font-medium">{formatted}</div>
        }
    },
    {
        accessorKey: 'kategori',
        header: 'Kategori',
    },
     {
        accessorKey: 'subkategori',
        header: 'Subkategori',
    },
    {
        accessorKey: 'deskripsi',
        header: 'Deskripsi',
        cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue('deskripsi')}</div>
    },
    {
        accessorKey: 'jumlah',
        header: () => <div className="text-right">Jumlah</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('jumlah'));
            if (isNaN(amount)) {
                return <div className="text-right font-mono">-</div>;
            }

            const formatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
            
            return <div className="text-right font-mono">{formatted}</div>
        }
    },
    {
        accessorKey: 'metodePembayaran',
        header: 'Metode Bayar',
        cell: ({ row }) => {
             return <Badge variant="outline">{row.getValue('metodePembayaran')}</Badge>
        }
    },
    {
        accessorKey: 'buktiUrl',
        header: 'Bukti',
        cell: ({ row }) => {
            const buktiUrl = row.getValue('buktiUrl') as string;
            const deskripsi = row.original.deskripsi;
            if (!buktiUrl) return <span className="text-xs text-muted-foreground">-</span>;

            return (
                <ViewBuktiDialog buktiUrl={buktiUrl} deskripsi={deskripsi}>
                    <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4"/>
                        <span className="sr-only">Lihat Bukti</span>
                    </Button>
                </ViewBuktiDialog>
            );
        }
    },
     {
        accessorKey: 'dicatatOleh',
        header: 'Dicatat Oleh',
    },
    ];

    if (isAdmin) {
        baseColumns.push({
            id: 'actions',
            cell: ({ row }) => {
                const item = row.original;
                return <AksiKolom item={item} refreshData={refreshData} />;
            },
        });
    }

    return baseColumns;
};
