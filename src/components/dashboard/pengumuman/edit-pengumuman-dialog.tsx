'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updatePengumumanAction } from '@/app/actions/pengumuman-actions';
import type { Pengumuman } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const pengumumanFormSchema = z.object({
  judul: z.string().min(1, { message: 'Judul tidak boleh kosong.' }),
  isi: z.string().min(1, { message: 'Isi pengumuman tidak boleh kosong.' }),
  target: z.string().optional(),
});

type PengumumanFormValues = z.infer<typeof pengumumanFormSchema>;

interface EditPengumumanDialogProps {
  item: Pengumuman;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function EditPengumumanDialog({ item, onSuccess, children }: EditPengumumanDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PengumumanFormValues>({
    resolver: zodResolver(pengumumanFormSchema),
    defaultValues: {
      judul: item.judul,
      isi: item.isi,
      target: item.target || '',
    },
  });

  async function onSubmit(values: PengumumanFormValues) {
     if (user?.peran !== 'Admin') {
        toast({
            title: 'Akses Ditolak',
            description: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
            variant: 'destructive',
        });
        return;
    }

    setIsSubmitting(true);

    try {
      const result = await updatePengumumanAction(user.peran, item.id, values);
      if (result.success) {
        toast({
          title: 'Sukses',
          description: result.message,
        });
        onSuccess();
        setOpen(false);
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
        description: 'Terjadi kesalahan saat memperbarui data.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Pengumuman</DialogTitle>
          <DialogDescription>
            Perbarui detail pengumuman di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
                <FormField
                control={form.control}
                name="judul"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Isi Pengumuman</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audiens (Opsional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Batal</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
