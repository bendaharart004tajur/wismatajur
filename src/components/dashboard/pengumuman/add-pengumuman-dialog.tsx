'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addPengumumanAction } from '@/app/actions/pengumuman-actions';

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
import { PlusCircle } from 'lucide-react';

const pengumumanFormSchema = z.object({
  judul: z.string().min(1, { message: 'Judul tidak boleh kosong.' }),
  isi: z.string().min(1, { message: 'Isi pengumuman tidak boleh kosong.' }),
  target: z.string().optional(),
});

type PengumumanFormValues = z.infer<typeof pengumumanFormSchema>;

export function AddPengumumanDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PengumumanFormValues>({
    resolver: zodResolver(pengumumanFormSchema),
    defaultValues: {
      judul: '',
      isi: '',
      target: '',
    },
  });

  async function onSubmit(values: PengumumanFormValues) {
    if (user?.peran !== 'Admin' || !user.nama) {
        toast({
            title: 'Akses Ditolak',
            description: 'Anda tidak memiliki izin atau nama pengguna tidak valid.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSubmitting(true);

    try {
      const result = await addPengumumanAction(user.peran, user.nama, values);
      if (result.success) {
        toast({
          title: 'Sukses',
          description: result.message,
        });
        onSuccess();
        setOpen(false);
        form.reset();
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
        description: 'Terjadi kesalahan saat menambahkan data.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Buat Pengumuman
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Buat Pengumuman Baru</DialogTitle>
          <DialogDescription>
            Isi detail pengumuman di bawah ini. Klik simpan jika sudah selesai.
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
                      <Input placeholder="Contoh: Kerja Bakti Bulanan" {...field} />
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
                      <Textarea placeholder="Deskripsikan pengumuman secara lengkap..." rows={5} {...field} />
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
                      <Input placeholder="Contoh: Semua Warga, Blok D1" {...field} />
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
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
