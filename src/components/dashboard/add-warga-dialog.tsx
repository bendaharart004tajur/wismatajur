'use client';

import { useState, type ReactNode } from 'react';
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
import { Warga } from '@/lib/types';
import { addWargaAction } from '@/app/actions/warga-actions';
import { ScrollArea } from '../ui/scroll-area';

interface AddWargaDialogProps {
  children: ReactNode;
  onWargaAdded: (newWarga: Warga) => void;
}

// Define options based on the Warga type
const blokOptions = ['D1', 'D2', 'D3', 'D4', 'D5'];
const statusKependudukanOptions = ['Tetap', 'Kontrak'];
const statusKepemilikanRumahOptions = ['Milik Sendiri', 'Sewa', 'Lainnya'];
const statusPerkawinanOptions = ['Kawin', 'Belum Kawin', 'Cerai'];


export function AddWargaDialog({ children, onWargaAdded }: AddWargaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Align formData state with the Warga type from types.ts
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    blok: '',
    noRumah: '',
    statusKependudukan: '',
    statusKepemilikanRumah: '',
    statusPerkawinan: '',
    pekerjaan: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setFormData({
        nama: '',
        email: '',
        telepon: '',
        blok: '',
        noRumah: '',
        statusKependudukan: '',
        statusKepemilikanRumah: '',
        statusPerkawinan: '',
        pekerjaan: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Ensure all required fields are filled
    for (const [key, value] of Object.entries(formData)) {
        if (!value) {
            toast({ title: 'Form Belum Lengkap', description: `Mohon isi field ${key}.`, variant: 'destructive' });
            setIsSubmitting(false);
            return;
        }
    }

    const result = await addWargaAction(formData as any);

    if (result.success && result.data) {
      toast({ title: 'Sukses', description: result.message });
      onWargaAdded(result.data);
      setIsOpen(false);
      resetForm();
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
            <DialogTitle>Tambah Warga Baru</DialogTitle>
            <DialogDescription>
              Isi data warga untuk ditambahkan ke sistem dan Google Sheet.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full pr-6">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nama" className="text-right">Nama</Label>
                <Input id="nama" value={formData.nama} onChange={handleInputChange} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telepon" className="text-right">Telepon</Label>
                <Input id="telepon" value={formData.telepon} onChange={handleInputChange} className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pekerjaan" className="text-right">Pekerjaan</Label>
                <Input id="pekerjaan" value={formData.pekerjaan} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blok" className="text-right">Blok</Label>
                <Select value={formData.blok} onValueChange={handleSelectChange('blok')} required>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih Blok" /></SelectTrigger>
                    <SelectContent>{blokOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="noRumah" className="text-right">No Rumah</Label>
                <Input id="noRumah" value={formData.noRumah} onChange={handleInputChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusKependudukan" className="text-right">Status Huni</Label>
                <Select value={formData.statusKependudukan} onValueChange={handleSelectChange('statusKependudukan')} required>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih Status Kependudukan" /></SelectTrigger>
                    <SelectContent>{statusKependudukanOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusKepemilikanRumah" className="text-right">Status Rumah</Label>
                <Select value={formData.statusKepemilikanRumah} onValueChange={handleSelectChange('statusKepemilikanRumah')} required>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih Status Kepemilikan" /></SelectTrigger>
                    <SelectContent>{statusKepemilikanRumahOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusPerkawinan" className="text-right">Perkawinan</Label>
                <Select value={formData.statusPerkawinan} onValueChange={handleSelectChange('statusPerkawinan')} required>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih Status Perkawinan" /></SelectTrigger>
                    <SelectContent>{statusPerkawinanOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className='pt-4'>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
