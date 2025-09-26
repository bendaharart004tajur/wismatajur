
'use client';

import { useState, type ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Warga } from '@/lib/types';
import { updateWargaAction } from '@/app/actions/warga-actions';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const blokOptions = ['D1', 'D2', 'D3', 'D4', 'D5'];
const statusTempatTinggalOptions = ['Tetap', 'Kontrak', 'Kosong'];
const statusKtpOptions = ['Local', 'No Local', 'Kosong'];
const jenisKelaminOptions = ['Laki-laki', 'Perempuan'];

// Match the full Warga type now
const wargaFormSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  jeniskelamin: z.string().min(1, 'Jenis kelamin wajib diisi'),
  telepon: z.string().optional().or(z.literal('')),
  blok: z.string().min(1, 'Blok wajib diisi'),
  norumah: z.string().min(1, 'Nomor rumah wajib diisi'),
  statustempattinggal: z.string().min(1, 'Status tempat tinggal wajib diisi'),
  statusktp: z.string().min(1, 'Status KTP wajib diisi'),
  kontakdarurat: z.string().optional().or(z.literal('')),
  pekerjaan: z.string().optional().or(z.literal('')),
  statusperkawinan: z.string().optional().or(z.literal('')),
});

type WargaFormValues = z.infer<typeof wargaFormSchema>;


interface EditWargaDialogProps {
  children: ReactNode;
  warga: Warga;
  onWargaUpdated: () => void;
}

export function EditWargaDialog({ children, warga, onWargaUpdated }: EditWargaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<WargaFormValues>({
    resolver: zodResolver(wargaFormSchema),
    defaultValues: {
      nama: warga.nama,
      email: warga.email,
      jeniskelamin: warga.jeniskelamin,
      telepon: warga.telepon,
      blok: warga.blok,
      norumah: warga.norumah,
      statustempattinggal: warga.statustempattinggal,
      statusktp: warga.statusktp,
      kontakdarurat: warga.kontakdarurat,
      pekerjaan: warga.pekerjaan,
      statusperkawinan: warga.statusperkawinan,
    },
  });

   useEffect(() => {
    if (isOpen) {
      form.reset({
        nama: warga.nama,
        email: warga.email || '',
        jeniskelamin: warga.jeniskelamin,
        telepon: warga.telepon || '',
        blok: warga.blok,
        norumah: warga.norumah,
        statustempattinggal: warga.statustempattinggal,
        statusktp: warga.statusktp,
        kontakdarurat: warga.kontakdarurat || '',
        pekerjaan: warga.pekerjaan || '',
        statusperkawinan: warga.statusperkawinan || '',
      });
    }
  }, [isOpen, warga, form]);


  const handleSubmit = async (values: WargaFormValues) => {
    setIsSubmitting(true);

    const result = await updateWargaAction({ 
        wargaId: warga.wargaId,
        ...values,
    } as Warga);

    if (result.success) {
      toast({ title: 'Sukses', description: result.message });
      onWargaUpdated(); 
      setIsOpen(false);
    } else {
      toast({ title: 'Gagal', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Data Warga</DialogTitle>
          <DialogDescription>
            Perbarui data untuk {warga.nama}. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
          <ScrollArea className="h-96 w-full pr-6">
            <div className="space-y-4 py-4">
                <FormField control={form.control} name="nama" render={({ field }) => (
                    <FormItem><FormLabel>Nama</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="jeniskelamin" render={({ field }) => (
                    <FormItem><FormLabel>Jenis Kelamin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Jenis Kelamin" /></SelectTrigger></FormControl>
                        <SelectContent>{jenisKelaminOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="blok" render={({ field }) => (
                        <FormItem><FormLabel>Blok</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih Blok" /></SelectTrigger></FormControl>
                            <SelectContent>{blokOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="norumah" render={({ field }) => (
                        <FormItem><FormLabel>No Rumah</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="statustempattinggal" render={({ field }) => (
                    <FormItem><FormLabel>Status Huni</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Status Huni" /></SelectTrigger></FormControl>
                        <SelectContent>{statusTempatTinggalOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="statusktp" render={({ field }) => (
                    <FormItem><FormLabel>Status KTP</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Status KTP" /></SelectTrigger></FormControl>
                        <SelectContent>{statusKtpOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email (Opsional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="telepon" render={({ field }) => (
                    <FormItem><FormLabel>No. Telepon (Opsional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="kontakdarurat" render={({ field }) => (
                    <FormItem><FormLabel>Kontak Darurat (Opsional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
          </ScrollArea>
          <DialogFooter className='pt-4'>
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
