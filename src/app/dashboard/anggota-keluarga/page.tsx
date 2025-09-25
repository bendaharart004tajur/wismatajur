import { getAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import { AnggotaKeluargaClientPage } from '@/components/dashboard/anggota-keluarga/anggota-keluarga-client-page';
import { getCurrentUser } from '@/lib/auth-ssr';
import type { Peran } from '@/lib/types';


export default async function AnggotaKeluargaPage() {
  const user = await getCurrentUser();
  
  // Fetch data on the server, ensuring we get all data for Admin/Pengawas view
  // and filtered data otherwise. The action itself handles the logic.
  const initialData = await getAnggotaKeluargaAction(
    user?.peran || 'User',
    user?.wargaId || ''
  );

  return (
    <AnggotaKeluargaClientPage initialData={initialData} />
  );
}
