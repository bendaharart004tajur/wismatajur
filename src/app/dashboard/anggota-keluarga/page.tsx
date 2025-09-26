import { getCurrentUser } from '@/lib/auth-ssr';
import { getAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import { AnggotaKeluargaClientPage } from '@/components/dashboard/anggota-keluarga/anggota-keluarga-client-page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AnggotaKeluargaPage() {
  const user = await getCurrentUser();

  if (!user || (user.peran !== 'Admin' && user.peran !== 'Pengawas')) {
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

  // Fetch data on the server
  const initialData = await getAnggotaKeluargaAction();
  
  return (
    <AnggotaKeluargaClientPage initialData={initialData} />
  );
}
