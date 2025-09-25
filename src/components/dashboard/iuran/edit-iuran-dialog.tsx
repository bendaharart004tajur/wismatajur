'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updateIuranAction } from '@/app/actions/iuran-actions';
import type { Iuran } from '@/lib/types';
import { cn } from '@/lib/utils';
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
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (value: number | undefined): string => {
    if (value === undefined) return '';
    return new Intl.NumberFormat('id-ID').format(value);
};

const parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, '')) || 0;
};

const iuranFormSchema = z.object({
    bulan: z.string().min(1, 'Bulan harus dipilih.'),
    tahun: z.coerce.number().min(2020, 'Tahun tidak valid.'),
    tanggalBayar: z.date({ required_error: 'Tanggal bayar harus diisi.' }),
    iuranLingkungan: z.number().min(0, "Harus berupa angka positif."),
    iuranSosial: z.number().min(0, "Harus berupa angka positif."),
    iuranMasjid: z.number().min(0, "Harus berupa angka positif."),
    totalIuran: z.number(), // Readonly
    status: z.enum(['Lunas', 'Belum Lunas']),
    metodePembayaran: z.enum(['Tunai', 'Transfer', 'E-Wallet']),
    buktiUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
    keterangan: z.string().optional(),
});

type IuranFormValues = z.infer<typeof iuranFormSchema>;

interface EditIuranDialogProps {
  item: Iuran;
  onSuccess: () => void;
  children: ReactNode;
}

const bulanOptions = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const tahunOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);


export function EditIuranDialog({ item, onSuccess, children }: EditIuranDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<IuranFormValues>({
        resolver: zodResolver(iuranFormSchema),
        defaultValues: {
            bulan: item.bulan,
            tahun: item.tahun,
            tanggalBayar: new Date(item.tanggalBayar),
            iuranLingkungan: item.iuranLingkungan,
            iuranSosial: item.iuranSosial,
            iuranMasjid: item.iuranMasjid,
            totalIuran: item.totalIuran,
            status: item.status,
            metodePembayaran: item.metodePembayaran,
            buktiUrl: item.buktiUrl || '',
            keterangan: item.keterangan || '',
        },
    });

     useEffect(() => {
        const subscription = form.watch((values, { name }) => {
            if (name === 'iuranLingkungan' || name === 'iuranSosial' || name === 'iuranMasjid') {
                const total = (values.iuranLingkungan || 0) + (values.iuranSosial || 0) + (values.iuranMasjid || 0);
                form.setValue('totalIuran', total);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    async function onSubmit(values: IuranFormValues) {
        if (!user || user.peran !== 'Admin') {
            toast({ title: 'Akses Ditolak', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const dataToUpdate = {
                ...values,
                tanggalBayar: values.tanggalBayar.toISOString(),
            };

            const result = await updateIuranAction(user.peran, item.iuranId, dataToUpdate);

            if (result.success) {
                toast({ title: 'Sukses', description: result.message });
                onSuccess();
                setOpen(false);
            } else {
                toast({ title: 'Gagal', description: result.message, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Terjadi kesalahan.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Catatan Iuran</DialogTitle>
                    <DialogDescription>Perbarui data pembayaran untuk {item.nama}.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <ScrollArea className="h-[60vh] pr-6">
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="bulan" render={({ field }) => (
                                        <FormItem><FormLabel>Bulan</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih bulan" /></SelectTrigger></FormControl>
                                            <SelectContent>{bulanOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="tahun" render={({ field }) => (
                                        <FormItem><FormLabel>Tahun</FormLabel><Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tahun" /></SelectTrigger></FormControl>
                                            <SelectContent>{tahunOptions.map(t => <SelectItem key={t} value={String(t)}>{t}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                </div>

                                <FormField control={form.control} name="tanggalBayar" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Tanggal Bayar</FormLabel><Popover>
                                        <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", { locale: localeId }) : <span>Pilih tanggal</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button></FormControl></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                    </Popover><FormMessage /></FormItem>
                                )}/>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <FormField control={form.control} name="iuranLingkungan" render={({ field }) => (
                                        <FormItem><FormLabel>Iuran Lingkungan</FormLabel><FormControl>
                                            <Input type="text" value={formatCurrency(field.value)} onChange={e => field.onChange(parseCurrency(e.target.value))} />
                                        </FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="iuranSosial" render={({ field }) => (
                                        <FormItem><FormLabel>Iuran Sosial</FormLabel><FormControl>
                                            <Input type="text" value={formatCurrency(field.value)} onChange={e => field.onChange(parseCurrency(e.target.value))} />
                                        </FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="iuranMasjid" render={({ field }) => (
                                        <FormItem><FormLabel>Iuran Masjid</FormLabel><FormControl>
                                             <Input type="text" value={formatCurrency(field.value)} onChange={e => field.onChange(parseCurrency(e.target.value))} />
                                        </FormControl><FormMessage /></FormItem>
                                    )}/>
                                     <FormField control={form.control} name="totalIuran" render={({ field }) => (
                                        <FormItem><FormLabel>Total Iuran</FormLabel><FormControl>
                                            <Input value={formatCurrency(field.value)} readOnly className="font-bold bg-muted" />
                                        </FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                               
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="status" render={({ field }) => (
                                        <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="Lunas">Lunas</SelectItem><SelectItem value="Belum Lunas">Belum Lunas</SelectItem></SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="metodePembayaran" render={({ field }) => (
                                        <FormItem><FormLabel>Metode Bayar</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="Tunai">Tunai</SelectItem><SelectItem value="Transfer">Transfer</SelectItem><SelectItem value="E-Wallet">E-Wallet</SelectItem></SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                </div>

                                <FormField control={form.control} name="buktiUrl" render={({ field }) => (
                                    <FormItem><FormLabel>Link Bukti (Opsional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="keterangan" render={({ field }) => (
                                    <FormItem><FormLabel>Keterangan (Opsional)</FormLabel><FormControl><Input placeholder="Contoh: Titipan dari Bpk. Fulan" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>

                            </div>
                        </ScrollArea>
                        <DialogFooter className="pt-6">
                            <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
