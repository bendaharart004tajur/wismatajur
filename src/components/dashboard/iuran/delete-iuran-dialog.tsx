'use client';

import { useState, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { deleteIuranAction } from '@/app/actions/iuran-actions';
import type { Iuran } from '@/lib/types';
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

interface DeleteIuranDialogProps {
  item: Iuran;
  onSuccess: () => void;
  children: ReactNode;
}

export function DeleteIuranDialog({ item, onSuccess, children }: DeleteIuranDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (user?.peran !== 'Admin') {
      toast({ title: 'Akses Ditolak', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteIuranAction(user.peran, item.iuranId);
      if (result.success) {
        toast({ title: 'Sukses', description: result.message });
        onSuccess();
      } else {
        toast({ title: 'Gagal', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Terjadi kesalahan.', variant: 'destructive' });
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
            Tindakan ini tidak bisa dibatalkan. Ini akan menghapus catatan iuran <span className='font-semibold'>{item.nama}</span> untuk bulan <span className='font-semibold'>{item.bulan} {item.tahun}</span> secara permanen.
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
