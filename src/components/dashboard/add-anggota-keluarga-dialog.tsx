'use client';

import { useState, useTransition, ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getWargaListForAnggotaKeluargaAction } from '@/app/actions/warga-actions';
import { addAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import type { Warga } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type WargaForSelection = Pick<Warga, 'wargaId' | 'nama' | 'blok' | 'norumah'>;

const formSchema = z.object({
  wargaId: z.string().optional(),
  nokk: z.string().min(16, 'Nomor KK harus 16 digit').max(16, 'Nomor KK harus 16 digit'),
  nama: z.string().min(1, 'Nama wajib diisi'),
  hubungan: z.string().min(1, 'Hubungan wajib diisi'),
  jeniskelamin: z.string().min(1, 'Jenis kelamin wajib diisi'),
  tanggallahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  uploadkkurl: z.string().url('URL tidak valid').optional().or(z.literal('')),
});

interface AddAnggotaKeluargaDialogProps {
  children: ReactNode;
  onAnggotaAdded: () => void;
}

export function AddAnggotaKeluargaDialog({ children, onAnggotaAdded }: AddAnggotaKeluargaDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [wargaList, setWargaList] = useState<WargaForSelection[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { wargaId: '', nokk: '', nama: '', hubungan: '', jeniskelamin: '', tanggallahir: '', uploadkkurl: '' },
  });

  useEffect(() => {
    if (user?.peran === 'Admin' && open) {
      getWargaListForAnggotaKeluargaAction().then(setWargaList);
    }
  }, [user, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: 'Error', description: 'Anda harus login untuk menambahkan data.', variant: 'destructive'});
        return;
    }

    const targetWargaId = user.peran === 'Admin' ? values.wargaId : user.wargaId;
    if (!targetWargaId) {
        toast({ title: 'Error', description: 'Kepala keluarga wajib dipilih.', variant: 'destructive' });
        return;
    }

    const { wargaId, ...anggotaData } = values;

    startTransition(async () => {
      const result = await addAnggotaKeluargaAction(user.peran, targetWargaId, anggotaData);
      if (result.success) {
        toast({ title: 'Sukses', description: result.message });
        onAnggotaAdded();
        setOpen(false);
        form.reset();
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
          <DialogTitle>Tambah Anggota Keluarga</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {user?.peran === 'Admin' && (
                 <FormField
                    control={form.control}
                    name="wargaId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Kepala Keluarga</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kepala keluarga..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {wargaList.map(w => (
                                <SelectItem key={w.wargaId} value={w.wargaId}>
                                {`${w.nama} (Blok ${w.blok} / ${w.norumah})`}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}

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
