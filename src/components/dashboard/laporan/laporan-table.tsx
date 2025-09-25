'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getIuranAction } from '@/app/actions/iuran-actions';
import { getPengeluaranAction } from '@/app/actions/pengeluaran-actions';
import { getWargaAction } from '@/app/actions/warga-actions';
import { getAnggotaKeluargaAction } from '@/app/actions/anggota-keluarga-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning } from 'lucide-react';
import type { Iuran, Pengeluaran, Warga, AnggotaKeluarga } from '@/lib/types';
import type { AnggotaKeluargaWithInfo } from '@/app/dashboard/anggota-keluarga/page';
import { id } from 'date-fns/locale';


type LaporanType = 'iuran' | 'pengeluaran' | 'warga' | 'keluarga';
type LaporanData = Iuran[] | Pengeluaran[] | Warga[] | AnggotaKeluargaWithInfo[];

interface LaporanTableProps {
    type: LaporanType;
    bulan: string;
    tahun: string;
}

const formatRupiah = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return '-';
    }
};

export default function LaporanTable({ type, bulan, tahun }: LaporanTableProps) {
    const { user } = useAuth();
    const [data, setData] = useState<LaporanData>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user || (user.peran !== 'Admin' && user.peran !== 'Pengawas')) {
            setError('Akses ditolak.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            let fetchedData: LaporanData = [];
            switch (type) {
                case 'iuran':
                    fetchedData = await getIuranAction(user.peran, user.wargaId);
                    break;
                case 'pengeluaran':
                    fetchedData = await getPengeluaranAction(user.peran);
                    break;
                case 'warga':
                    fetchedData = await getWargaAction(user.peran, user.wargaId);
                    break;
                case 'keluarga':
                    fetchedData = await getAnggotaKeluargaAction(user.peran, user.wargaId);
                    break;
            }
            setData(fetchedData);
        } catch (e) {
            console.error(`Gagal memuat data laporan ${type}:`, e);
            setError(`Gagal memuat data laporan ${type}.`);
        } finally {
            setIsLoading(false);
        }
    }, [user, type]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        const intBulan = parseInt(bulan, 10);
        const intTahun = parseInt(tahun, 10);

        if (isNaN(intTahun)) return data;

        // Filter by year first for all types that have date
        let yearFilteredData = data;
        const dateFieldMap: {[key in LaporanType]?: string} = {
            'iuran': 'tahun',
            'pengeluaran': 'tanggal',
        };
        const dateField = dateFieldMap[type];

        if (dateField) {
            yearFilteredData = (data as any[]).filter(item => {
                if (dateField === 'tahun') {
                    return item.tahun === intTahun;
                }
                const itemDate = new Date(item[dateField]);
                return itemDate.getFullYear() === intTahun;
            });
        }
        
        if (bulan === 'all') {
            return yearFilteredData;
        }
        
        const targetMonth = intBulan - 1; // 0-indexed month

        if (type === 'iuran') {
            const bulanNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const targetBulanName = bulanNames[targetMonth];
            return (yearFilteredData as Iuran[]).filter(item => item.bulan === targetBulanName);
        }

        if (type === 'pengeluaran') {
            return (yearFilteredData as Pengeluaran[]).filter(item => {
                const itemDate = new Date(item.tanggal);
                return itemDate.getMonth() === targetMonth;
            });
        }
        
        // Warga dan Anggota Keluarga are not filtered by date
        return yearFilteredData;
    }, [data, bulan, tahun, type]);
    
    
    const { groupedIuran, grandTotalIuran } = useMemo(() => {
        if (type !== 'iuran' || !filteredData) {
            return { groupedIuran: {}, grandTotalIuran: { lingkungan: 0, sosial: 0, masjid: 0, total: 0 } };
        }

        const grouped: { [key: string]: { items: Iuran[], subtotalLingkungan: number, subtotalSosial: number, subtotalMasjid: number, subtotalTotal: number } } = {};
        
        let grandTotalLingkungan = 0;
        let grandTotalSosial = 0;
        let grandTotalMasjid = 0;
        let grandTotal = 0;

        for (const item of filteredData as Iuran[]) {
            const blok = item.blok || 'Lainnya';
            if (!grouped[blok]) {
                grouped[blok] = { items: [], subtotalLingkungan: 0, subtotalSosial: 0, subtotalMasjid: 0, subtotalTotal: 0 };
            }
            grouped[blok].items.push(item);
            grouped[blok].subtotalLingkungan += item.iuranLingkungan || 0;
            grouped[blok].subtotalSosial += item.iuranSosial || 0;
            grouped[blok].subtotalMasjid += item.iuranMasjid || 0;
            grouped[blok].subtotalTotal += item.totalIuran || 0;

            grandTotalLingkungan += item.iuranLingkungan || 0;
            grandTotalSosial += item.iuranSosial || 0;
            grandTotalMasjid += item.iuranMasjid || 0;
            grandTotal += item.totalIuran || 0;
        }

        const sortedBloks = Object.keys(grouped).sort();
        const sortedGrouped: typeof grouped = {};
        for(const blok of sortedBloks) {
            sortedGrouped[blok] = grouped[blok];
        }

        return {
            groupedIuran: sortedGrouped,
            grandTotalIuran: { lingkungan: grandTotalLingkungan, sosial: grandTotalSosial, masjid: grandTotalMasjid, total: grandTotal }
        };

    }, [filteredData, type]);

    const { groupedPengeluaran, grandTotalPengeluaran } = useMemo(() => {
        if (type !== 'pengeluaran' || !filteredData) {
            return { groupedPengeluaran: {}, grandTotalPengeluaran: 0 };
        }

        const grouped: { [key: string]: { items: Pengeluaran[], subtotal: number } } = {};
        let grandTotal = 0;

        for (const item of filteredData as Pengeluaran[]) {
            const monthKey = new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            if (!grouped[monthKey]) {
                grouped[monthKey] = { items: [], subtotal: 0 };
            }
            grouped[monthKey].items.push(item);
            grouped[monthKey].subtotal += item.jumlah || 0;
            grandTotal += item.jumlah || 0;
        }

        const sortedMonthKeys = Object.keys(grouped).sort((a, b) => {
            const monthNameA = a.split(' ')[0];
            const yearA = parseInt(a.split(' ')[1]);
            const monthNameB = b.split(' ')[0];
            const yearB = parseInt(b.split(' ')[1]);

            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const dateA = new Date(yearA, monthNames.indexOf(monthNameA));
            const dateB = new Date(yearB, monthNames.indexOf(monthNameB));
            
            return dateB.getTime() - dateA.getTime();
        });

        const sortedGrouped: typeof grouped = {};
        for (const key of sortedMonthKeys) {
            sortedGrouped[key] = grouped[key];
        }

        return { groupedPengeluaran: sortedGrouped, grandTotalPengeluaran: grandTotal };
    }, [filteredData, type]);

    const renderHeaders = () => {
        switch (type) {
            case 'iuran': return (
                <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Blok</TableHead>
                    <TableHead className="text-right">Lingkungan</TableHead>
                    <TableHead className="text-right">Sosial</TableHead>
                    <TableHead className="text-right">Masjid</TableHead>
                    <TableHead className="text-right">Total Iuran</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            );
            case 'pengeluaran': return (
                <TableRow>
                    <TableHead>Tanggal</TableHead><TableHead>Kategori</TableHead><TableHead>Deskripsi</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead>Oleh</TableHead>
                </TableRow>
            );
            case 'warga': return (
                <TableRow>
                    <TableHead>Nama</TableHead><TableHead>Blok/No</TableHead><TableHead>Status Huni</TableHead><TableHead>Status KTP</TableHead><TableHead>Telepon</TableHead>
                </TableRow>
            );
            case 'keluarga': return (
                <TableRow>
                    <TableHead>Kepala Keluarga</TableHead><TableHead>Alamat</TableHead><TableHead>Nama Anggota</TableHead><TableHead>Hubungan</TableHead><TableHead>Jenis Kelamin</TableHead>
                </TableRow>
            );
            default: return null;
        }
    };
    
    const renderRows = () => {
         if (Object.keys(filteredData).length === 0) {
            return <TableRow><TableCell colSpan={8} className="h-24 text-center">Tidak ada data untuk periode ini.</TableCell></TableRow>;
        }

        switch (type) {
            case 'iuran':
                return Object.entries(groupedIuran).map(([blok, group]) => (
                    <React.Fragment key={blok}>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={8} className="font-bold">Blok {blok}</TableCell>
                        </TableRow>
                        {group.items.map(item => (
                            <TableRow key={item.iuranId}>
                                <TableCell>{item.nama}</TableCell>
                                <TableCell>{item.bulan} {item.tahun}</TableCell>
                                <TableCell>{item.blok}</TableCell>
                                <TableCell className="text-right">{formatRupiah(item.iuranLingkungan)}</TableCell>
                                <TableCell className="text-right">{formatRupiah(item.iuranSosial)}</TableCell>
                                <TableCell className="text-right">{formatRupiah(item.iuranMasjid)}</TableCell>
                                <TableCell className="text-right font-semibold">{formatRupiah(item.totalIuran)}</TableCell>
                                <TableCell>{item.status}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 hover:bg-muted/50 font-bold">
                            <TableCell colSpan={3} className="text-right">Subtotal Blok {blok}</TableCell>
                            <TableCell className="text-right">{formatRupiah(group.subtotalLingkungan)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(group.subtotalSosial)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(group.subtotalMasjid)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(group.subtotalTotal)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </React.Fragment>
                ));
            case 'pengeluaran': 
                return Object.entries(groupedPengeluaran).map(([month, group]) => (
                     <React.Fragment key={month}>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={5} className="font-bold">{month}</TableCell>
                        </TableRow>
                        {group.items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{formatDate(item.tanggal)}</TableCell>
                                <TableCell>{item.kategori}</TableCell>
                                <TableCell>{item.deskripsi}</TableCell>
                                <TableCell className="text-right">{formatRupiah(item.jumlah)}</TableCell>
                                <TableCell>{item.dicatatOleh}</TableCell>
                            </TableRow>
                        ))}
                         <TableRow className="bg-muted/50 hover:bg-muted/50 font-bold">
                            <TableCell colSpan={3} className="text-right">Subtotal {month}</TableCell>
                            <TableCell className="text-right">{formatRupiah(group.subtotal)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                     </React.Fragment>
                ));
            case 'warga': return (filteredData as Warga[]).map(item => (
                <TableRow key={item.wargaId}><TableCell>{item.nama}</TableCell><TableCell>{item.blok}/{item.norumah}</TableCell><TableCell>{item.statustempattinggal}</TableCell><TableCell>{item.statusktp}</TableCell><TableCell>{item.phone}</TableCell></TableRow>
            ));
            case 'keluarga': return (filteredData as AnggotaKeluargaWithInfo[]).map(item => (
                <TableRow key={item.anggotaId}><TableCell>{item.kepalaKeluarga}</TableCell><TableCell>{item.alamat}</TableCell><TableCell>{item.nama}</TableCell><TableCell>{item.hubungan}</TableCell><TableCell>{item.jeniskelamin}</TableCell></TableRow>
            ));
            default: return null;
        }
    };


    if (isLoading) {
        return (
            <div className="space-y-4 pt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    
    if (error) {
        return (
             <Alert variant="destructive" className='mt-4'>
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="overflow-x-auto mt-4 border rounded-md">
            <Table>
                <TableHeader>{renderHeaders()}</TableHeader>
                <TableBody>{renderRows()}</TableBody>
                 {type === 'iuran' && grandTotalIuran.total > 0 && (
                    <TableFooter>
                        <TableRow className="bg-primary/20 hover:bg-primary/25 font-bold text-base">
                            <TableCell colSpan={3} className="text-right">GRAND TOTAL</TableCell>
                            <TableCell className="text-right">{formatRupiah(grandTotalIuran.lingkungan)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(grandTotalIuran.sosial)}</TableCell>
                             <TableCell className="text-right">{formatRupiah(grandTotalIuran.masjid)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(grandTotalIuran.total)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                )}
                 {type === 'pengeluaran' && grandTotalPengeluaran > 0 && (
                     <TableFooter>
                        <TableRow className="bg-primary/20 hover:bg-primary/25 font-bold text-base">
                            <TableCell colSpan={3} className="text-right">GRAND TOTAL</TableCell>
                            <TableCell className="text-right">{formatRupiah(grandTotalPengeluaran)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </div>
    );
}
