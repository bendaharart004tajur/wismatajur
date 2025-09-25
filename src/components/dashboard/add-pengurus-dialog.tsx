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
import { Jabatan, Peran, Blok, Pengurus, Warga } from '@/lib/types';
import { addPengurusAction } from '@/app/actions/pengurus-actions';
import { getWargaAction } from '@/app/actions/warga-actions';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface AddPengurusDialogProps {
  children: ReactNode;
  onPengurusAdded: () => void;
}

type PengurusForForm = Omit<Pengurus, 'password'>;

const jabatanOptions: Jabatan[] = ['Ketua RT', 'Sekertaris', 'Bendahara', 'Koordinator', 'Humas', 'Seksi Pembangunan', 'Seksi Ketahanan Pangan', 'Seksi Sosial dan Keagamaan', 'Seksi Keamanan', 'Warga'];
const peranOptions: Peran[] = ['Admin', 'Pengawas', 'Koordinator', 'User'];
const blokOptions: Blok[] = ['D1', 'D2', 'D3', 'D4', 'D5'];

export function AddPengurusDialog({ children, onPengurusAdded }: AddPengurusDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);

  const [password, setPassword] = useState('');
  const [jabatan, setJabatan] = useState<Jabatan | ''>('');
  const [peran, setPeran] = useState<Peran | ''>('');
  const [blok, setBlok] = useState<Blok | ''>('');
  
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      getWargaAction('Admin', '').then(setWargaList);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarga || !jabatan || !peran || !password) {
        toast({ title: "Form Belum Lengkap", description: "Mohon pilih warga dan isi semua field yang wajib.", variant: "destructive" });
        return;
    }
    if (peran === 'Koordinator' && !blok) {
        toast({ title: "Form Belum Lengkap", description: "Untuk peran Koordinator, Blok wajib diisi.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    const formData = {
        wargaId: selectedWarga.wargaId,
        nama: selectedWarga.nama,
        email: selectedWarga.email,
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
      // Reset form
      setSelectedWarga(null);
      setJabatan('');
      setPeran('');
      setBlok('');
      setPassword('');
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
            <DialogTitle>Tambah Pengurus Baru</DialogTitle>
            <DialogDescription>
              Pilih warga yang akan dijadikan pengurus. Data akan terisi otomatis.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Warga</Label>
               <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
                  >
                    {selectedWarga
                      ? `${selectedWarga.nama} (${selectedWarga.blok}/${selectedWarga.norumah})`
                      : "Pilih warga..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Cari warga..." />
                    <CommandList>
                        <CommandEmpty>Warga tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                        {wargaList.map((warga) => (
                            <CommandItem
                            key={warga.wargaId}
                            value={warga.nama}
                            onSelect={(currentValue) => {
                                const wargaSelection = wargaList.find(w => w.nama.toLowerCase() === currentValue.toLowerCase()) || null;
                                setSelectedWarga(wargaSelection);
                                setPopoverOpen(false);
                            }}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                selectedWarga?.wargaId === warga.wargaId ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {warga.nama} ({warga.blok}/{warga.norumah})
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
