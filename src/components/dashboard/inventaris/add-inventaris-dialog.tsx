'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addInventarisAction } from '@/app/actions/inventaris-actions';

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

const inventarisFormSchema = z.object({
  namaBarang: z.string().min(1, { message: 'Nama barang tidak boleh kosong.' }),
  jumlah: z.coerce.number().min(1, { message: 'Jumlah harus lebih dari 0.' }),
  lokasiPenyimpanan: z.string().min(1, { message: 'Lokasi tidak boleh kosong.' }),
  penanggungJawab: z.string().min(1, { message: 'Penanggung jawab tidak boleh kosong.' }),
  keterangan: z.string().optional(),
});

type InventarisFormValues = z.infer<typeof inventarisFormSchema>;

export function AddInventarisDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InventarisFormValues>({
    resolver: zodResolver(inventarisFormSchema),
    defaultValues: {
      namaBarang: '',
      jumlah: 1,
      lokasiPenyimpanan: '',
      penanggungJawab: '',
      keterangan: '',
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
      const result = await addInventarisAction(user.peran, values);
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
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Inventaris
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Barang Inventaris</DialogTitle>
          <DialogDescription>
            Isi detail barang baru di bawah ini. Klik simpan jika sudah selesai.
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
                      <Input placeholder="Contoh: Kursi Plastik" {...field} />
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
                      <Input placeholder="Contoh: Gudang RT" {...field} />
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
                      <Input placeholder="Contoh: Bpk. Budi" {...field} />
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
                      <Textarea placeholder="Kondisi barang, dll." {...field} />
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
