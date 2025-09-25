import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dice5 } from "lucide-react";

export default function ArisanPage() {
  return (
    <div className="space-y-6">
         <div>
          <h1 className="text-2xl font-headline font-bold">Arisan Warga</h1>
          <p className="text-muted-foreground">
            Informasi mengenai kegiatan arisan warga.
          </p>
        </div>
        <Card className="text-center flex flex-col items-center justify-center p-10 min-h-96">
            <CardHeader>
                <div className="mx-auto bg-muted p-3 rounded-full">
                 <Dice5 className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">Segera Hadir</CardTitle>
                <CardDescription>
                Fitur untuk mengelola data arisan warga sedang dalam pengembangan.
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
  );
}
