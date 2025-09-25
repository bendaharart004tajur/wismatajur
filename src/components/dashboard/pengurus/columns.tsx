'use client';

import type { Pengurus } from '@/lib/types';
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
import { EditPengurusDialog } from '../edit-pengurus-dialog';
import { DeletePengurusAlert } from '../delete-pengurus-alert';
import { useState } from 'react';

type PengurusWithoutPassword = Omit<Pengurus, 'password'>;


function AksiKolom({ item, refreshData }: { item: PengurusWithoutPassword, refreshData: () => void }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
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
                    <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {isEditDialogOpen && (
                <EditPengurusDialog
                    pengurus={item}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onPengurusUpdated={refreshData}
                />
            )}
            {isDeleteDialogOpen && (
                 <DeletePengurusAlert
                    pengurusId={item.id}
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onPengurusDeleted={refreshData}
                />
            )}

        </>
    );
}

export const columns = (refreshData: () => void): ColumnDef<PengurusWithoutPassword>[] => [
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
        cell: ({ row }) => <div className="font-medium pl-4">{row.getValue('nama')}</div>
    },
    {
        accessorKey: 'jabatan',
        header: 'Jabatan',
    },
    {
        accessorKey: 'peran',
        header: 'Peran',
        cell: ({ row }) => {
            const peran = row.getValue('peran') as string;
            return <Badge variant={peran === 'Admin' ? 'default' : 'secondary'}>{peran}</Badge>;
        }
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const item = row.original;
            return <AksiKolom item={item} refreshData={refreshData} />;
        },
        enableHiding: false,
    },
];
