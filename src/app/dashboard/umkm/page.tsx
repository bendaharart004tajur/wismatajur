import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

export default function UmkmPage() {
  return (
    <div className="space-y-6">
         <div>
          <h1 className="text-2xl font-headline font-bold">UMKM Warga</h1>
          <p className="text-muted-foreground">
            Daftar usaha mikro, kecil, dan menengah milik warga.
          </p>
        </div>
        <Card className="text-center flex flex-col items-center justify-center p-10 min-h-96">
            <CardHeader>
                <div className="mx-auto bg-muted p-3 rounded-full">
                 <Store className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">Segera Hadir</CardTitle>
                <CardDescription>
                Fitur untuk menampilkan data UMKM warga sedang dalam pengembangan.
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
  );
}
