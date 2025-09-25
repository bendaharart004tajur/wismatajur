'use client';

import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export type MonthlySummary = {
  month: string;
  pemasukan: number;
  pengeluaran: number;
};

interface MonthlyFinanceChartProps {
  data: MonthlySummary[];
}

const formatRupiahYAxis = (value: number) => {
    if (value === 0) return 'Rp 0';
    if (value < 1000000) return `Rp ${(value / 1000).toFixed(0)}rb`;
    return `Rp ${(value / 1000000).toFixed(1)}jt`;
}

const formatLabel = (value: number) => {
    if (value === 0) return '';
    if (value < 1000000) return `${(value / 1000).toFixed(0)}rb`;
    return `${(value / 1000000).toFixed(1)}jt`;
};


const chartConfig = {
    pemasukan: {
        label: 'Pemasukan',
        color: 'hsl(var(--chart-2))',
    },
    pengeluaran: {
        label: 'Pengeluaran',
        color: 'hsl(var(--destructive))',
    },
};

export default function MonthlyFinanceChart({ data }: MonthlyFinanceChartProps) {
  const noData = !data || data.length === 0;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Ringkasan Keuangan Bulanan</CardTitle>
        <CardDescription>Perbandingan Pemasukan (Iuran & Pendapatan Lain) dan Pengeluaran per bulan.</CardDescription>
      </CardHeader>
      <CardContent>
        {noData ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Data Tidak Cukup</AlertTitle>
            <AlertDescription>
              Data keuangan belum tersedia untuk ditampilkan dalam bagan.
            </AlertDescription>
          </Alert>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-64 md:min-h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.substring(0, 3)}
                />
                <YAxis
                  tickFormatter={(value) => formatRupiahYAxis(value as number)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                />
                 <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        labelFormatter={(label, payload) => {
                            // Find the full month name from the original data
                            const entry = data.find(d => d.month.startsWith(label));
                            return entry ? entry.month : label;
                        }}
                        formatter={(value, name) => (
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartConfig[name as keyof typeof chartConfig]?.color }}></div>
                                <div className="flex flex-1 justify-between">
                                    <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                                    <span className="font-bold font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value as number)}</span>
                                </div>
                            </div>
                        )}
                    />}
                />
                <Legend />
                <Bar dataKey="pemasukan" fill="var(--color-pemasukan)" radius={[4, 4, 0, 0]} name="Pemasukan">
                    <LabelList dataKey="pemasukan" position="top" formatter={formatLabel} className="fill-foreground text-xs" />
                </Bar>
                <Bar dataKey="pengeluaran" fill="var(--color-pengeluaran)" radius={[4, 4, 0, 0]} name="Pengeluaran">
                    <LabelList dataKey="pengeluaran" position="top" formatter={formatLabel} className="fill-foreground text-xs" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
