import { getWargaAction } from '@/app/actions/warga-actions';
import { WargaClientPage } from '@/components/dashboard/warga/warga-client-page';
import { getCurrentUser } from '@/lib/auth-ssr';

export default async function WargaPage() {
  const user = await getCurrentUser();

  const initialData = await getWargaAction(
    user?.peran || 'User',
    user?.wargaId,
    user?.blok
  );

  return (
    <WargaClientPage initialData={initialData} />
  );
}
