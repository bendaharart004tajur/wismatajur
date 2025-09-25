'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import LaporanTable from '@/components/dashboard/laporan/laporan-table';

const bulanOptions = [
    { value: 'all', label: 'Semua Bulan' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

const tahunOptions = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

export default function LaporanPage() {
    const { user } = useAuth();
    // Default to the current month (1-indexed) and current year
    const [bulan, setBulan] = useState(String(new Date().getMonth() + 1));
    const [tahun, setTahun] = useState(String(new Date().getFullYear()));
    const [activeTab, setActiveTab] = useState('iuran');

    const handlePrint = () => {
        // This is a placeholder for the print functionality
        // It uses the browser's print dialog
        window.print();
    };

    if (user?.peran !== 'Admin' && user?.peran !== 'Pengawas') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Akses Ditolak</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Anda tidak memiliki izin untuk mengakses halaman ini. Hanya Admin dan Pengawas yang dapat melihat laporan.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className='flex-1'>
                    <h1 className="text-2xl font-headline font-bold">Laporan Keuangan & Kependudukan</h1>
                    <p className="text-muted-foreground">
                        Pilih jenis laporan dan periode yang ingin Anda lihat.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                     <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print / Export PDF
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className='flex-1'>Data Laporan</CardTitle>
                        <div className="flex items-center gap-2">
                             <Select value={bulan} onValueChange={setBulan}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Pilih Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bulanOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={tahun} onValueChange={setTahun}>
                                <SelectTrigger className="w-full md:w-[120px]">
                                    <SelectValue placeholder="Pilih Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tahunOptions.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                            <TabsTrigger value="iuran">Iuran</TabsTrigger>
                            <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
                            <TabsTrigger value="warga">Warga</TabsTrigger>
                            <TabsTrigger value="keluarga">Anggota Keluarga</TabsTrigger>
                        </TabsList>
                        <TabsContent value="iuran">
                           <LaporanTable type="iuran" bulan={bulan} tahun={tahun} />
                        </TabsContent>
                        <TabsContent value="pengeluaran">
                             <LaporanTable type="pengeluaran" bulan={bulan} tahun={tahun} />
                        </TabsContent>
                        <TabsContent value="warga">
                            <LaporanTable type="warga" bulan={bulan} tahun={tahun} />
                        </TabsContent>
                        <TabsContent value="keluarga">
                             <LaporanTable type="keluarga" bulan={bulan} tahun={tahun} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
