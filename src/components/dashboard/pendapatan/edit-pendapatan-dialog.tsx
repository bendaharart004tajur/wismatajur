'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { updatePendapatanAction } from '@/app/actions/pendapatan-actions';
import type { Pendapatan } from '@/lib/types';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';

const pendapatanFormSchema = z.object({
  tanggal: z.date({ required_error: 'Tanggal harus diisi.' }),
  keterangan: z.string().min(1, { message: 'Keterangan tidak boleh kosong.' }),
  nominal: z.any().refine(val => val !== '' && val !== null && val > 0, { message: 'Nominal harus diisi dan lebih dari 0.' }),
});

type PendapatanFormValues = z.infer<typeof pendapatanFormSchema>;

const formatCurrency = (value: string | number) => {
    if (!value) return '';
    const numberValue = Number(String(value).replace(/[^0-9]/g, ''));
    return new Intl.NumberFormat('de-DE').format(numberValue);
};

interface EditPendapatanDialogProps {
  item: Pendapatan;
  onSuccess: () => void;
  children: React.ReactNode;
}

export function EditPendapatanDialog({ item, onSuccess, children }: EditPendapatanDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PendapatanFormValues>({
    resolver: zodResolver(pendapatanFormSchema),
    defaultValues: {
        tanggal: new Date(item.tanggal),
        keterangan: item.keterangan,
        nominal: item.nominal,
    },
  });

  async function onSubmit(values: PendapatanFormValues) {
    if (user?.peran !== 'Admin') {
        toast({ title: 'Akses Ditolak', description: 'Anda tidak memiliki izin.', variant: 'destructive' });
        return;
    }
    
    setIsSubmitting(true);

    try {
      const rawNominal = String(values.nominal).replace(/[^0-9]/g, '');
      const dataToSend = {
          ...values,
          nominal: Number(rawNominal),
          tanggal: values.tanggal.toISOString(),
      };
      const result = await updatePendapatanAction(user.peran, item.id, dataToSend);

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
          <DialogTitle>Edit Catatan Pendapatan</DialogTitle>
          <DialogDescription>
            Perbarui detail pendapatan di bawah ini.
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
                    name="keterangan"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Keterangan</FormLabel>
                        <FormControl>
                            <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="nominal"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nominal (Rp)</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Contoh: 500000"
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
