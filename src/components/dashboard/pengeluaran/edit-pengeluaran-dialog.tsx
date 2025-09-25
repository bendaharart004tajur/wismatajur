'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updatePengeluaranAction } from '@/app/actions/pengeluaran-actions';
import type { Pengeluaran } from '@/lib/types';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';


const pengeluaranFormSchema = z.object({
  tanggal: z.date({ required_error: 'Tanggal harus diisi.' }),
  kategori: z.string().min(1, { message: 'Kategori harus dipilih.' }),
  subkategori: z.string().optional(),
  deskripsi: z.string().min(1, { message: 'Deskripsi tidak boleh kosong.' }),
  jumlah: z.any().refine(val => val !== '' && val !== null && val > 0, { message: 'Jumlah harus diisi dan lebih dari 0.' }),
  metodePembayaran: z.string().min(1, { message: 'Metode pembayaran harus dipilih.' }),
  buktiUrl: z.string().optional(),
});

type PengeluaranFormValues = z.infer<typeof pengeluaranFormSchema>;

const kategoriOptions = ["Listrik & Air", "Perawatan Fasilitas", "Kegiatan Warga", "Administrasi", "Lain-lain"];
const metodePembayaranOptions = ["Tunai", "Transfer Bank", "E-Wallet"];

const formatCurrency = (value: string | number) => {
    if (!value) return '';
    const numberValue = Number(String(value).replace(/[^0-9]/g, ''));
    return new Intl.NumberFormat('de-DE').format(numberValue);
};

interface EditPengeluaranDialogProps {
  item: Pengeluaran;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function EditPengeluaranDialog({ item, onSuccess, children }: EditPengeluaranDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PengeluaranFormValues>({
    resolver: zodResolver(pengeluaranFormSchema),
    defaultValues: {
        tanggal: new Date(item.tanggal),
        kategori: item.kategori,
        subkategori: item.subkategori || '',
        deskripsi: item.deskripsi,
        jumlah: item.jumlah,
        metodePembayaran: item.metodePembayaran,
        buktiUrl: item.buktiUrl || '',
    },
  });

  async function onSubmit(values: PengeluaranFormValues) {
    if (user?.peran !== 'Admin') {
        toast({ title: 'Akses Ditolak', description: 'Anda tidak memiliki izin.', variant: 'destructive' });
        return;
    }
    
    setIsSubmitting(true);

    try {
      const rawJumlah = String(values.jumlah).replace(/[^0-9]/g, '');
      const dataToSend = {
          ...values,
          jumlah: Number(rawJumlah),
          tanggal: values.tanggal.toISOString(),
      };
      const result = await updatePengeluaranAction(user.peran, item.id, dataToSend);

      if (result.success) {
        toast({ title: 'Sukses', description: result.message });
        onSuccess();
        setOpen(false);
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Terjadi kesalahan saat memperbarui data.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Catatan Pengeluaran</DialogTitle>
          <DialogDescription>
            Perbarui detail pengeluaran di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
               <FormField
                  control={form.control}
                  name="tanggal"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: id })
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="deskripsi"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
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
                            <FormLabel>Jumlah (Rp)</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Contoh: 50000"
                                    type="text"
                                    {...field}
                                    value={formatCurrency(field.value)}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                        field.onChange(rawValue ? Number(rawValue) : '');
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="kategori"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kategori</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori pengeluaran" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {kategoriOptions.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="subkategori"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subkategori (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Lampu Philips 15W" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="metodePembayaran"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Metode Pembayaran</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih metode pembayaran" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {metodePembayaranOptions.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="buktiUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Link Bukti Pembayaran (Opsional)</FormLabel>
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
