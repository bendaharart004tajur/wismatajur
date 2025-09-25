'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateInventarisAction } from '@/app/actions/inventaris-actions';
import type { Inventaris } from '@/lib/types';

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

const inventarisFormSchema = z.object({
  namaBarang: z.string().min(1, { message: 'Nama barang tidak boleh kosong.' }),
  jumlah: z.coerce.number().min(1, { message: 'Jumlah harus lebih dari 0.' }),
  lokasiPenyimpanan: z.string().min(1, { message: 'Lokasi tidak boleh kosong.' }),
  penanggungJawab: z.string().min(1, { message: 'Penanggung jawab tidak boleh kosong.' }),
  keterangan: z.string().optional(),
});

type InventarisFormValues = z.infer<typeof inventarisFormSchema>;

interface EditInventarisDialogProps {
  item: Inventaris;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function EditInventarisDialog({ item, onSuccess, children }: EditInventarisDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InventarisFormValues>({
    resolver: zodResolver(inventarisFormSchema),
    defaultValues: {
      namaBarang: item.namaBarang,
      jumlah: item.jumlah,
      lokasiPenyimpanan: item.lokasiPenyimpanan,
      penanggungJawab: item.penanggungJawab,
      keterangan: item.keterangan || '',
    },
  });

  async function onSubmit(values: InventarisFormValues) {
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
      const result = await updateInventarisAction(user.peran, item.id, values);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Barang Inventaris</DialogTitle>
          <DialogDescription>
            Perbarui detail barang di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="namaBarang"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Barang</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jumlah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lokasiPenyimpanan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi Penyimpanan</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="penanggungJawab"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penanggung Jawab</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="keterangan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keterangan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
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
