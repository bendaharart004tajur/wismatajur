'use client';

import { Iuran } from '@/lib/types';
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
import { EditIuranDialog } from './edit-iuran-dialog';
import { DeleteIuranDialog } from './delete-iuran-dialog';
import { ViewBuktiDialog } from '@/components/dashboard/pengeluaran/view-bukti-dialog';

const formatRupiah = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};


function AksiKolom({ item, refreshData }: { item: Iuran, refreshData: () => void }) {
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
                 <EditIuranDialog item={item} onSuccess={refreshData}>
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditIuranDialog>
                <DeleteIuranDialog item={item} onSuccess={refreshData}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DeleteIuranDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const columns = (refreshData: () => void, isAdmin: boolean): ColumnDef<Iuran>[] => {
    const baseColumns: ColumnDef<Iuran>[] = [
        {
            accessorKey: 'nama',
             header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Nama Warga
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                 const item = row.original;
                return (
                    <div className="pl-4 font-medium">
                        {item.nama}
                         {item.blok && item.norumah && <div className="text-xs text-muted-foreground">{item.blok}/{item.norumah}</div>}
                    </div>
                )
            }
        },
        {
            accessorKey: 'iuranLingkungan',
            header: () => <div className="text-right">Lingkungan</div>,
            cell: ({ row }) => <div className="text-right font-mono pr-4">{formatRupiah(row.getValue('iuranLingkungan'))}</div>
        },
        {
            accessorKey: 'iuranSosial',
            header: () => <div className="text-right">Sosial</div>,
            cell: ({ row }) => <div className="text-right font-mono pr-4">{formatRupiah(row.getValue('iuranSosial'))}</div>
        },
        {
            accessorKey: 'iuranMasjid',
            header: () => <div className="text-right">Masjid</div>,
            cell: ({ row }) => <div className="text-right font-mono pr-4">{formatRupiah(row.getValue('iuranMasjid'))}</div>
        },
         {
            accessorKey: 'totalIuran',
            header: () => <div className="text-right">Total Iuran</div>,
            cell: ({ row }) => <div className="text-right font-bold font-mono pr-4">{formatRupiah(row.getValue('totalIuran'))}</div>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return <div><Badge variant={status === 'Lunas' ? 'default' : 'destructive'}>{status}</Badge></div>;
            }
        },
        {
            accessorKey: 'metodePembayaran',
            header: 'Metode Bayar',
            cell: ({ row }) => {
                const metode = row.getValue('metodePembayaran') as string;
                return <div className="hidden sm:table-cell"><Badge variant="secondary">{metode}</Badge></div>;
            }
        },
        {
            accessorKey: 'tanggalBayar',
            header: 'Tgl. Bayar',
            cell: ({ row }) => {
                const date = new Date(row.getValue('tanggalBayar'));
                 if (isNaN(date.getTime())) {
                    return <div className="hidden md:table-cell">-</div>;
                }
                const formatted = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                return <div className="hidden md:table-cell">{formatted}</div>
            }
        },
        {
            accessorKey: 'keterangan',
            header: 'Keterangan',
            cell: ({row}) => <div className="hidden lg:table-cell text-xs">{row.getValue('keterangan')}</div>
        },
        {
            accessorKey: 'buktiUrl',
            header: 'Bukti',
            cell: ({ row }) => {
                const buktiUrl = row.getValue('buktiUrl') as string;
                if (!buktiUrl) return <span className="hidden lg:table-cell text-xs text-muted-foreground">-</span>;
                return (
                    <div className="hidden lg:table-cell">
                        <ViewBuktiDialog buktiUrl={buktiUrl} deskripsi={`Iuran ${row.original.nama} ${row.original.bulan} ${row.original.tahun}`}>
                            <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4"/>
                                <span className="sr-only">Lihat Bukti</span>
                            </Button>
                        </ViewBuktiDialog>
                    </div>
                );
            }
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
