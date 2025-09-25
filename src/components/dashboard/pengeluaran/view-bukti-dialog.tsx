'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';

interface ViewBuktiDialogProps {
  buktiUrl: string;
  deskripsi: string;
  children: React.ReactNode;
}

export function ViewBuktiDialog({ buktiUrl, deskripsi, children }: ViewBuktiDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bukti Pembayaran</DialogTitle>
          <DialogDescription>
            Bukti untuk: {deskripsi}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-center">
          {buktiUrl ? (
            <Image 
              src={buktiUrl} 
              alt={`Bukti untuk ${deskripsi}`} 
              width={400} 
              height={400} 
              className="rounded-md object-contain" 
            />
          ) : (
            <p className='text-muted-foreground'>Tidak ada bukti yang dilampirkan.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
