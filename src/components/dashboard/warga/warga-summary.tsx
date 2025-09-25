'use client';

import type { Warga } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WargaSummaryProps {
  data: Warga[];
}

export function WargaSummary({ data }: WargaSummaryProps) {
  const totalWarga = data.length;

  const wargaPerBlok = data.reduce((acc, warga) => {
    const blok = warga.blok || 'Lainnya';
    acc[blok] = (acc[blok] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedBlok = Object.keys(wargaPerBlok).sort();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Total Warga:</span>
            <Badge variant="default">{totalWarga}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-sm font-medium">Per Blok:</span>
            {sortedBlok.map(blok => (
              <div key={blok} className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{blok}:</span>
                <Badge variant="secondary">{wargaPerBlok[blok]}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
