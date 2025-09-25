'use client';

import { useTransition } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deletePengurusAction } from '@/app/actions/pengurus-actions';

interface DeletePengurusAlertProps {
  pengurusId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPengurusDeleted: () => void;
}

export function DeletePengurusAlert({ pengurusId, open, onOpenChange, onPengurusDeleted }: DeletePengurusAlertProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePengurusAction(pengurusId);
      if (result.success) {
        toast({ title: 'Berhasil', description: result.message });
        onPengurusDeleted();
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Gagal', description: result.message });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat diurungkan. Ini akan menghapus data pengurus secara permanen dari server.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
             {isPending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
