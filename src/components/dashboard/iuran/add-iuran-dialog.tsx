'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getWargaListForAnggotaKeluargaAction } from '@/app/actions/warga-actions';
import { addBulkIuranAction } from '@/app/actions/iuran-actions';
import type { Warga } from '@/lib/types';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (value: number | undefined): string => {
    if (value === undefined) return '';
    return new Intl.NumberFormat('id-ID').format(value);
};

const parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, '')) || 0;
};


const iuranFormSchema = z.object({
    wargaId: z.string().min(1, 'Warga harus dipilih.'),
    startBulan: z.string().min(1, 'Bulan awal harus dipilih.'),
    endBulan: z.string().min(1, 'Bulan akhir harus dipilih.'),
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
type WargaForSelection = Pick<Warga, 'wargaId' | 'nama' | 'blok' | 'norumah'>;

const bulanOptions = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const tahunOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);


export function AddIuranDialog({ onSuccess }: { onSuccess: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [wargaList, setWargaList] = useState<WargaForSelection[]>([]);

    const form = useForm<IuranFormValues>({
        resolver: zodResolver(iuranFormSchema),
        defaultValues: {
            wargaId: '',
            startBulan: bulanOptions[new Date().getMonth()],
            endBulan: bulanOptions[new Date().getMonth()],
            tahun: new Date().getFullYear(),
            iuranLingkungan: 36000,
            iuranSosial: 0,
            iuranMasjid: 0,
            totalIuran: 36000,
            status: 'Lunas',
            metodePembayaran: 'Tunai',
            buktiUrl: '',
            keterangan: '',
        },
    });

    useEffect(() => {
        if (open) {
            getWargaListForAnggotaKeluargaAction().then(setWargaList);
        }
    }, [open]);

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
            toast({ title: 'Akses Ditolak', description: 'Anda tidak memiliki izin.', variant: 'destructive' });
            return;
        }

        const selectedWarga = wargaList.find(w => w.wargaId === values.wargaId);
        if (!selectedWarga) {
            toast({ title: 'Error', description: 'Warga tidak valid.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const dataToSend = {
                wargaId: values.wargaId,
                nama: selectedWarga.nama,
                startBulan: values.startBulan,
                endBulan: values.endBulan,
                tahun: values.tahun,
                tanggalBayar: values.tanggalBayar.toISOString(),
                iuranLingkungan: values.iuranLingkungan,
                iuranSosial: values.iuranSosial,
                iuranMasjid: values.iuranMasjid,
                totalIuran: values.totalIuran,
                status: values.status,
                metodePembayaran: values.metodePembayaran,
                dicatatOleh: user.nama,
                buktiUrl: values.buktiUrl,
                keterangan: values.keterangan,
            };

            const result = await addBulkIuranAction(user.peran, dataToSend);

            if (result.success) {
                toast({ title: 'Sukses', description: result.message });
                onSuccess();
                setOpen(false);
                form.reset();
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
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Catat Iuran
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Catat Pembayaran Iuran Baru</DialogTitle>
                    <DialogDescription>Isi detail pembayaran iuran di bawah ini. Anda bisa memilih rentang bulan.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <ScrollArea className="h-[60vh] pr-6">
                            <div className="space-y-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="wargaId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Nama Warga</FormLabel>
                                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                            {field.value ? wargaList.find(w => w.wargaId === field.value)?.nama : "Pilih warga"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Cari nama warga..." />
                                                        <CommandList>
                                                            <CommandEmpty>Warga tidak ditemukan.</CommandEmpty>
                                                            <CommandGroup>
                                                                {wargaList.map((warga) => (
                                                                    <CommandItem
                                                                        value={warga.nama}
                                                                        key={warga.wargaId}
                                                                        onSelect={() => {
                                                                            form.setValue('wargaId', warga.wargaId);
                                                                            setPopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", warga.wargaId === field.value ? "opacity-100" : "opacity-0")} />
                                                                        {`${warga.nama} (Blok ${warga.blok}/${warga.norumah})`}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name="startBulan" render={({ field }) => (
                                        <FormItem><FormLabel>Dari Bulan</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih bulan" /></SelectTrigger></FormControl>
                                            <SelectContent>{bulanOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="endBulan" render={({ field }) => (
                                        <FormItem><FormLabel>Sampai Bulan</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih bulan" /></SelectTrigger></FormControl>
                                            <SelectContent>{bulanOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name="tahun" render={({ field }) => (
                                        <FormItem><FormLabel>Tahun</FormLabel><Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih tahun" /></SelectTrigger></FormControl>
                                            <SelectContent>{tahunOptions.map(t => <SelectItem key={t} value={String(t)}>{t}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>

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
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
