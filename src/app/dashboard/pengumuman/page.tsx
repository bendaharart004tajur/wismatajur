import { getPengumumanAction } from '@/app/actions/pengumuman-actions';
import { PengumumanClientPage } from '@/components/dashboard/pengumuman/pengumuman-client-page';


export default async function PengumumanPage() {
  // Fetch data on the server
  const initialData = await getPengumumanAction();
  
  return (
    <PengumumanClientPage initialData={initialData} />
  );
}
