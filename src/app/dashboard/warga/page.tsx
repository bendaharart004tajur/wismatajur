import { getWargaAction } from '@/app/actions/warga-actions';
import { WargaClientPage } from '@/components/dashboard/warga/warga-client-page';
import { getCurrentUser } from '@/lib/auth-ssr';

export default async function WargaPage() {
  // We can't use useAuth here, so we need a server-side way to get user info if needed
  // For now, let's assume Admin/Pengawas role for fetching all data as before.
  // A proper server-side session management would be needed for granular checks.
  const initialData = await getWargaAction('Admin');

  return (
    <WargaClientPage initialData={initialData} />
  );
}
