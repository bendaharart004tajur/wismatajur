'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Pengurus, Jabatan, Peran, Blok } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updatePengurusAction } from '@/app/actions/pengurus-actions';

type PengurusToEdit = Omit<Pengurus, 'password'>;

interface EditPengurusDialogProps {
  pengurus: PengurusToEdit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPengurusUpdated: () => void;
}

const JABATAN_OPTIONS: Jabatan[] = ['Ketua RT', 'Sekertaris', 'Bendahara', 'Koordinator', 'Humas', 'Seksi Pembangunan', 'Seksi Ketahanan Pangan', 'Seksi Sosial dan Keagamaan', 'Warga'];
const PERAN_OPTIONS: Peran[] = ['Admin', 'Koordinator', 'User'];
const BLOK_OPTIONS: Blok[] = ['D1', 'D2', 'D3', 'D4', 'D5'];

export function EditPengurusDialog({ pengurus, open, onOpenChange, onPengurusUpdated }: EditPengurusDialogProps) {
  const [jabatan, setJabatan] = useState<Jabatan>(pengurus.jabatan);
  const [peran, setPeran] = useState<Peran>(pengurus.peran);
  const [blok, setBlok] = useState<Blok | undefined>(pengurus.blok);
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  useEffect(() => {
    if (open) {
      setJabatan(pengurus.jabatan);
      setPeran(pengurus.peran);
      setBlok(pengurus.blok);
      setPassword('');
    }
  }, [open, pengurus]);


  const handleSave = () => {
    startTransition(async () => {
      if (peran === 'Koordinator' && !blok) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Blok harus diisi untuk peran Koordinator.' });
        return;
      }
      
      const updatedData: Partial<Pengurus> & { id: string } = {
        id: pengurus.id,
        jabatan,
        peran,
        blok: peran === 'Koordinator' ? blok : undefined,
      };

      if (password) {
        updatedData.password = password;
      }

      const result = await updatePengurusAction(updatedData);

      if (result.success && result.data) {
        toast({ title: 'Berhasil', description: result.message });
        onPengurusUpdated();
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Gagal', description: result.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Data Pengurus</DialogTitle>
          <DialogDescription>Ubah detail untuk {pengurus.nama}. Klik simpan jika sudah selesai.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password Baru</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Kosongkan jika tidak ingin diubah" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Select value={jabatan} onValueChange={(value) => setJabatan(value as Jabatan)}>
                <SelectTrigger id="jabatan">
                    <SelectValue placeholder="Pilih Jabatan" />
                </SelectTrigger>
                <SelectContent>
                    {JABATAN_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="peran">Peran Sistem</Label>
             <Select value={peran} onValueChange={(value) => setPeran(value as Peran)}>
                <SelectTrigger id="peran">
                    <SelectValue placeholder="Pilih Peran" />
                </SelectTrigger>
                <SelectContent>
                    {PERAN_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          {peran === 'Koordinator' && (
            <div className="space-y-2">
              <Label htmlFor="blok">Blok Koordinator</Label>
               <Select value={blok} onValueChange={(value) => setBlok(value as Blok)}>
                <SelectTrigger id="blok">
                    <SelectValue placeholder="Pilih Blok" />
                </SelectTrigger>
                <SelectContent>
                    {BLOK_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
            </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Batal</Button>
          <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
