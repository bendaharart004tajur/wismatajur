'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { deletePengeluaranAction } from '@/app/actions/pengeluaran-actions';
import type { Pengeluaran } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeletePengeluaranDialogProps {
  item: Pengeluaran;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function DeletePengeluaranDialog({ item, onSuccess, children }: DeletePengeluaranDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (user?.peran !== 'Admin') {
        toast({ title: 'Akses Ditolak', description: 'Anda tidak memiliki izin.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);

    try {
      const result = await deletePengeluaranAction(user.peran, item.id);
      if (result.success) {
        toast({ title: 'Sukses', description: result.message });
        onSuccess();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Terjadi kesalahan saat menghapus data.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anda Yakin Ingin Menghapus?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak bisa dibatalkan. Ini akan menghapus catatan pengeluaran untuk <span className='font-semibold'>{item.deskripsi}</span> secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
