import { getIuranAction } from '@/app/actions/iuran-actions';
import { IuranClientPage } from '@/components/dashboard/iuran/iuran-client-page';
import { getCurrentUser } from '@/lib/auth-ssr';

export default async function IuranPage() {
  const user = await getCurrentUser();

  const initialData = await getIuranAction(
    user?.peran || 'User',
    user?.wargaId || '',
    user?.blok
  );
  
  return (
    <IuranClientPage initialData={initialData} />
  );
}
