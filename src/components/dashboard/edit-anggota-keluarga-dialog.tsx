'use client';

import { useState, useTransition, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import type { AnggotaKeluarga } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  nokk: z.string().min(16, 'Nomor KK harus 16 digit').max(16, 'Nomor KK harus 16 digit'),
  nama: z.string().min(1, 'Nama wajib diisi'),
  hubungan: z.string().min(1, 'Hubungan wajib diisi'),
  jeniskelamin: z.string().min(1, 'Jenis kelamin wajib diisi'),
  tanggallahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  uploadkkurl: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

interface EditAnggotaKeluargaDialogProps {
  children: ReactNode;
  anggota: AnggotaKeluarga;
  onAnggotaUpdated: () => void;
}

export function EditAnggotaKeluargaDialog({ children, anggota, onAnggotaUpdated }: EditAnggotaKeluargaDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nokk: anggota.nokk,
      nama: anggota.nama,
      hubungan: anggota.hubungan,
      jeniskelamin: anggota.jeniskelamin,
      tanggallahir: new Date(anggota.tanggallahir).toISOString().split('T')[0], // Format to YYYY-MM-DD
      uploadkkurl: anggota.uploadkkurl || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: 'Error', description: 'Anda harus login untuk mengubah data.', variant: 'destructive' });
        return;
    }

    startTransition(async () => {
      const result = await updateAnggotaKeluargaAction(user.peran, { anggotaId: anggota.anggotaId, ...values });
      if (result.success) {
        toast({ title: 'Sukses', description: result.message });
        onAnggotaUpdated();
        setOpen(false);
      } else {
        toast({ title: 'Gagal', description: result.message, variant: 'destructive' });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Anggota Keluarga</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nokk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. Kartu Keluarga</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan 16 digit No. KK" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="hubungan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hubungan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hubungan keluarga" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Istri">Istri</SelectItem>
                      <SelectItem value="Anak">Anak</SelectItem>
                      <SelectItem value="Orang Tua">Orang Tua</SelectItem>
                      <SelectItem value="Mertua">Mertua</SelectItem>
                      <SelectItem value="Saudara">Saudara</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jeniskelamin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Kelamin</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tanggallahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Lahir</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="uploadkkurl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Google Drive KK</FormLabel>
                  <FormControl>
                     <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Batal</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
