'use client';

import { useState, type ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Warga } from '@/lib/types';
import { updateWargaAction } from '@/app/actions/warga-actions';
import { ScrollArea } from '../ui/scroll-area';

interface EditWargaDialogProps {
  children: ReactNode;
  warga: Warga;
  onWargaUpdated: () => void;
}

const blokOptions = ['D1', 'D2', 'D3', 'D4', 'D5'];
const statusTempatTinggalOptions = ['Tetap', 'Kontrak'];

export function EditWargaDialog({ children, warga, onWargaUpdated }: EditWargaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Warga>>(warga);

  useEffect(() => {
    // Reset form data when the dialog is opened with new `warga` props
    setFormData(warga);
  }, [warga, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Partial<Warga>) => (value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.wargaId) {
        toast({ title: 'Error', description: 'Warga ID tidak ditemukan.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    const result = await updateWargaAction(formData as Warga & { wargaId: string });

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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Data Warga</DialogTitle>
            <DialogDescription>
              Perbarui data warga. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full pr-6">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nama" className="text-right">Nama</Label>
                <Input id="nama" value={formData.nama || ''} onChange={handleInputChange} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Telepon</Label>
                <Input id="phone" value={formData.phone || ''} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blok" className="text-right">Blok</Label>
                <Select value={formData.blok || ''} onValueChange={handleSelectChange('blok')} required>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih Blok" /></SelectTrigger>
                    <SelectContent>{blokOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="norumah" className="text-right">No Rumah</Label>
                <Input id="norumah" value={formData.norumah || ''} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statustempattinggal" className="text-right">Status Huni</Label>
                <Select value={formData.statustempattinggal || ''} onValueChange={handleSelectChange('statustempattinggal')} required>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih Status Huni" /></SelectTrigger>
                    <SelectContent>{statusTempatTinggalOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className='pt-4'>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
