'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useToast } from '@/hooks/use-toast';
import { addWargaAction } from '@/app/actions/warga-actions';
import type { Warga } from '@/lib/types';

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

const wargaFormSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  jeniskelamin: z.string().min(1, 'Jenis kelamin wajib diisi'),
  phone: z.string().optional().or(z.literal('')),
  blok: z.string().min(1, 'Blok wajib diisi'),
  norumah: z.string().min(1, 'Nomor rumah wajib diisi'),
  statustempattinggal: z.string().min(1, 'Status tempat tinggal wajib diisi'),
  statusktp: z.string().min(1, 'Status KTP wajib diisi'),
  kontakdarurat: z.string().optional().or(z.literal('')),
});

type WargaFormValues = z.infer<typeof wargaFormSchema>;


interface AddWargaDialogProps {
  children: ReactNode;
  onWargaAdded: () => void;
}

export function AddWargaDialog({ children, onWargaAdded }: AddWargaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<WargaFormValues>({
    resolver: zodResolver(wargaFormSchema),
    defaultValues: {
      nama: '',
      email: '',
      jeniskelamin: '',
      phone: '',
      blok: '',
      norumah: '',
      statustempattinggal: '',
      statusktp: '',
      kontakdarurat: '',
    },
  });

  const handleSubmit = async (values: WargaFormValues) => {
    setIsSubmitting(true);

    const newWarga: Warga = {
        ...values,
        email: values.email || '',
        phone: values.phone || '',
        kontakdarurat: values.kontakdarurat || '',
        wargaId: `warga-${Date.now()}`,
        fotoprofilurl: '',
        uploadktpurl: '',
        tanggalinput: new Date().toISOString(),
    };

    const result = await addWargaAction(newWarga);

    if (result.success) {
      toast({ title: 'Sukses', description: result.message });
      onWargaAdded();
      setIsOpen(false);
      form.reset();
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
            <DialogTitle>Tambah Warga Baru</DialogTitle>
            <DialogDescription>
              Isi data warga untuk ditambahkan ke sistem dan Google Sheet.
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
                <FormField control={form.control} name="phone" render={({ field }) => (
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
