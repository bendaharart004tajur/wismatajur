import { useAuth } from '@/context/AuthContext';
import type { Inventaris } from '@/lib/types';
import { getInventarisAction } from '@/app/actions/inventaris-actions';
import { InventarisClientPage } from '@/components/dashboard/inventaris/inventaris-client-page';


export default async function InventarisPage() {
  // Fetch data on the server
  const initialData = await getInventarisAction();
  
  return (
    <InventarisClientPage initialData={initialData} />
  );
}
