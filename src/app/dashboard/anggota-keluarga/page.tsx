import { getAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import { AnggotaKeluargaClientPage } from '@/components/dashboard/anggota-keluarga/anggota-keluarga-client-page';
import { getCurrentUser } from '@/lib/auth-ssr';
import type { AnggotaKeluarga } from '@/lib/types';

export type AnggotaKeluargaWithInfo = AnggotaKeluarga & {
  kepalaKeluarga?: string;
  alamat?: string;
};

export default async function AnggotaKeluargaPage() {
  const user = await getCurrentUser();
  
  const initialData: AnggotaKeluargaWithInfo[] = await getAnggotaKeluargaAction(
    user?.peran || 'User',
    user?.wargaId || ''
  );

  return (
    <AnggotaKeluargaClientPage initialData={initialData} />
  );
}
