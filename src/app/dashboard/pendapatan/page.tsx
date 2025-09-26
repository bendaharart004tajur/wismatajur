import { getPendapatanAction } from '@/app/actions/pendapatan-actions';
import { PendapatanClientPage } from '@/components/dashboard/pendapatan/pendapatan-client-page';
import { getCurrentUser } from '@/lib/auth-ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default async function PendapatanPage() {
  const user = await getCurrentUser();

  if (!user || (user.peran !== 'Admin' && user.peran !== 'Pengawas')) {
    return (
       <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <TrendingUp /> Data Pendapatan
          </h1>
          <p className="text-muted-foreground">
            Catatan pendapatan lain-lain di luar iuran warga.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Akses Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Anda tidak memiliki izin untuk mengakses halaman ini. Hanya Admin dan Pengawas yang dapat melihat data pendapatan.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch data on the server
  const initialData = await getPendapatanAction(user.peran);
  
  return (
    <PendapatanClientPage initialData={initialData} />
  );
}
