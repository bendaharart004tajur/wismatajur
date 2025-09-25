import { redirect } from 'next/navigation';
import { getAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import { AnggotaKeluargaClientPage } from '@/components/dashboard/anggota-keluarga/anggota-keluarga-client-page';
import { getCurrentUser } from '@/lib/auth-ssr';
import type { AnggotaKeluarga } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type AnggotaKeluargaWithInfo = AnggotaKeluarga & {
  kepalaKeluarga?: string;
  alamat?: string;
};

export default async function AnggotaKeluargaPage() {
  const user = await getCurrentUser();

  // Safeguard: Only allow Admin and Pengawas to access this page
  if (!user || (user.peran !== 'Admin' && user.peran !== 'Pengawas')) {
    // You can redirect or show an access denied message. Redirecting is safer.
    return (
        <Card>
            <CardHeader>
                <CardTitle>Akses Ditolak</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            </CardContent>
        </Card>
    );
  }
  
  const initialData: AnggotaKeluargaWithInfo[] = await getAnggotaKeluargaAction(
    user.peran
  );

  return (
    <AnggotaKeluargaClientPage initialData={initialData} />
  );
}
