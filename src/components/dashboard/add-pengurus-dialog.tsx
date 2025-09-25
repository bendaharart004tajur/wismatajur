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
import { Jabatan, Peran, Blok } from '@/lib/types';
import { addPengurusAction } from '@/app/actions/pengurus-actions';
import { useAuth } from '@/context/AuthContext';

interface AddPengurusDialogProps {
  children: ReactNode;
  onPengurusAdded: () => void;
}

const jabatanOptions: Jabatan[] = ['Ketua RT', 'Sekertaris', 'Bendahara', 'Koordinator', 'Humas', 'Seksi Pembangunan', 'Seksi Ketahanan Pangan', 'Seksi Sosial dan Keagamaan', 'Seksi Keamanan', 'Warga'];
const peranOptions: Peran[] = ['Admin', 'Pengawas', 'Koordinator', 'User'];
const blokOptions: Blok[] = ['D1', 'D2', 'D3', 'D4', 'D5'];

export function AddPengurusDialog({ children, onPengurusAdded }: AddPengurusDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jabatan, setJabatan] = useState<Jabatan | ''>('');
  const [peran, setPeran] = useState<Peran | ''>('');
  const [blok, setBlok] = useState<Blok | ''>('');
  
  const resetForm = () => {
    setNama('');
    setEmail('');
    setPassword('');
    setJabatan('');
    setPeran('');
    setBlok('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !email || !jabatan || !peran || !password) {
        toast({ title: "Form Belum Lengkap", description: "Mohon isi semua field yang wajib.", variant: "destructive" });
        return;
    }
    if (peran === 'Koordinator' && !blok) {
        toast({ title: "Form Belum Lengkap", description: "Untuk peran Koordinator, Blok wajib diisi.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    const formData = {
        // wargaId will be generated on the server if needed, or based on email logic
        wargaId: `warga-${email}`, 
        nama: nama,
        email: email,
        password: password,
        jabatan: jabatan as Jabatan,
        peran: peran as Peran,
        blok: peran === 'Koordinator' ? blok as Blok : undefined,
    };
    
    const result = await addPengurusAction(formData);

    if (result.success) {
      toast({ title: 'Sukses', description: result.message });
      onPengurusAdded();
      setIsOpen(false);
      resetForm();
    } else {
      toast({ title: 'Gagal', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Pengurus Baru</DialogTitle>
            <DialogDescription>
              Isi data pengurus baru. Akun ini akan digunakan untuk login.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="Masukkan nama" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Masukkan email untuk login" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Masukkan password baru" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="jabatan">Jabatan</Label>
                <Select value={jabatan} onValueChange={(value) => setJabatan(value as Jabatan)} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                        {jabatanOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="peran">Peran Sistem</Label>
                <Select value={peran} onValueChange={(value) => setPeran(value as Peran)} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Peran Sistem" />
                    </SelectTrigger>
                    <SelectContent>
                        {peranOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             {peran === 'Koordinator' && (
              <div className="space-y-2">
                <Label htmlFor="blok">Blok Koordinator</Label>
                 <Select value={blok} onValueChange={(value) => setBlok(value as Blok)} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Blok Koordinator" />
                    </SelectTrigger>
                    <SelectContent>
                        {blokOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
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
