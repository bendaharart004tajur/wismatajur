'use client';

import { useState, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { deleteWargaAction } from '@/app/actions/warga-actions';
import type { Warga } from '@/lib/types';

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
import { useAuth } from '@/context/AuthContext';

interface DeleteWargaAlertProps {
  warga: Warga;
  onWargaDeleted: () => void;
  children: ReactNode;
}

export function DeleteWargaAlert({ warga, onWargaDeleted, children }: DeleteWargaAlertProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const result = await deleteWargaAction(user.peran, warga.wargaId);
      if (result.success) {
        toast({
          title: 'Sukses',
          description: result.message,
        });
        onWargaDeleted();
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus data.',
        variant: 'destructive',
      });
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
            Tindakan ini tidak bisa dibatalkan. Ini akan menghapus data warga <span className='font-semibold'>{warga.nama}</span> secara permanen.
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
