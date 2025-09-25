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
        if (!user) {
            setError('Anda harus login untuk melihat laporan.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            let fetchedData: LaporanData = [];
            // For reports, we always fetch data as if we're an Admin on the backend
            // Then, we filter it on the client-side based on the actual user's role
            switch (type) {
                case 'iuran':
                    fetchedData = await getIuranAction('Admin', '');
                    break;
                case 'pengeluaran':
                    if (user.peran !== 'Admin' && user.peran !== 'Pengawas') {
                        setError('Hanya Admin dan Pengawas yang dapat melihat laporan pengeluaran.');
                        fetchedData = [];
                    } else {
                        fetchedData = await getPengeluaranAction('Admin');
                    }
                    break;
                case 'warga':
                    fetchedData = await getWargaAction('Admin', '');
                    break;
                case 'keluarga':
                    fetchedData = await getAnggotaKeluargaAction('Admin', '');
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

    const roleFilteredData = useMemo(() => {
        if (!user) return [];
        if (user.peran === 'Admin' || user.peran === 'Pengawas') return data;
        
        switch (type) {
            case 'iuran':
                if (user.peran === 'Koordinator') {
                    return (data as Iuran[]).filter(item => item.blok === user.blok);
                }
                if (user.peran === 'User') {
                    return (data as Iuran[]).filter(item => item.wargaId === user.wargaId);
                }
                break;
            case 'warga':
                 if (user.peran === 'Koordinator') {
                    return (data as Warga[]).filter(item => item.blok === user.blok);
                }
                if (user.peran === 'User') {
                    return (data as Warga[]).filter(item => item.wargaId === user.wargaId);
                }
                break;
            case 'keluarga':
                 if (user.peran === 'Koordinator') {
                    const wargaInBlok = (data as AnggotaKeluargaWithInfo[]).filter(item => item.alamat?.includes(`Blok ${user.blok}`));
                    return wargaInBlok;
                }
                if (user.peran === 'User') {
                     return (data as AnggotaKeluargaWithInfo[]).filter(item => item.wargaId === user.wargaId);
                }
                break;
            case 'pengeluaran':
                // Already handled in fetchData
                return data;
        }
        return data;

    }, [data, user, type]);


    const filteredData = useMemo(() => {
        const intBulan = parseInt(bulan, 10);
        const intTahun = parseInt(tahun, 10);

        if (isNaN(intTahun)) return roleFilteredData;

        // Filter by year first for all types that have date
        let yearFilteredData = roleFilteredData;
        const dateFieldMap: {[key in LaporanType]?: string} = {
            'iuran': 'tahun',
            'pengeluaran': 'tanggal',
        };
        const dateField = dateFieldMap[type];

        if (dateField) {
            yearFilteredData = (roleFilteredData as any[]).filter(item => {
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
    }, [roleFilteredData, bulan, tahun, type]);
    
    
   const { groupedIuran, grandTotalIuran } = useMemo(() => {
        if (type !== 'iuran' || !filteredData) {
            return { groupedIuran: {}, grandTotalIuran: { lingkungan: 0, sosial: 0, masjid: 0, total: 0 } };
        }

        const grouped: { 
            [monthKey: string]: { 
                blok: { 
                    [blokKey: string]: { 
                        items: Iuran[],
                        subtotalLingkungan: number, 
                        subtotalSosial: number, 
                        subtotalMasjid: number, 
                        subtotalTotal: number 
                    } 
                },
                monthSubtotalLingkungan: number,
                monthSubtotalSosial: number,
                monthSubtotalMasjid: number,
                monthSubtotalTotal: number,
            } 
        } = {};
        
        let grandTotalLingkungan = 0;
        let grandTotalSosial = 0;
        let grandTotalMasjid = 0;
        let grandTotal = 0;
        
        const bulanNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        const sortedData = (filteredData as Iuran[]).sort((a, b) => {
            const dateA = new Date(a.tahun, bulanNames.indexOf(a.bulan));
            const dateB = new Date(b.tahun, bulanNames.indexOf(b.bulan));
            if (dateB.getTime() !== dateA.getTime()) {
                return dateB.getTime() - dateA.getTime();
            }
            if (a.blok && b.blok && a.blok !== b.blok) {
                return a.blok.localeCompare(b.blok);
            }
            // Nama descending
            const nameB = b.nama || '';
            const nameA = a.nama || '';
            const nameCompare = nameA.localeCompare(nameB);
            if (nameCompare !== 0) {
                return nameCompare;
            }

            // Bulan descending
            const monthB = bulanNames.indexOf(b.bulan);
            const monthA = bulanNames.indexOf(a.bulan);
            return monthB - monthA;
        });

        for (const item of sortedData) {
            if (item.status !== 'Lunas') continue;
            
            const monthKey = `${item.bulan} ${item.tahun}`;
            const blokKey = item.blok || 'Lainnya';

            // Initialize month group
            if (!grouped[monthKey]) {
                grouped[monthKey] = { blok: {}, monthSubtotalLingkungan: 0, monthSubtotalSosial: 0, monthSubtotalMasjid: 0, monthSubtotalTotal: 0 };
            }

            // Initialize blok sub-group
            if (!grouped[monthKey].blok[blokKey]) {
                grouped[monthKey].blok[blokKey] = { items: [], subtotalLingkungan: 0, subtotalSosial: 0, subtotalMasjid: 0, subtotalTotal: 0 };
            }

            // Add item and update subtotals
            grouped[monthKey].blok[blokKey].items.push(item);
            grouped[monthKey].blok[blokKey].subtotalLingkungan += item.iuranLingkungan || 0;
            grouped[monthKey].blok[blokKey].subtotalSosial += item.iuranSosial || 0;
            grouped[monthKey].blok[blokKey].subtotalMasjid += item.iuranMasjid || 0;
            grouped[monthKey].blok[blokKey].subtotalTotal += item.totalIuran || 0;
            
            grouped[monthKey].monthSubtotalLingkungan += item.iuranLingkungan || 0;
            grouped[monthKey].monthSubtotalSosial += item.iuranSosial || 0;
            grouped[monthKey].monthSubtotalMasjid += item.iuranMasjid || 0;
            grouped[monthKey].monthSubtotalTotal += item.totalIuran || 0;

            grandTotalLingkungan += item.iuranLingkungan || 0;
            grandTotalSosial += item.iuranSosial || 0;
            grandTotalMasjid += item.iuranMasjid || 0;
            grandTotal += item.totalIuran || 0;
        }
        
        const sortedMonthKeys = Object.keys(grouped).sort((a, b) => {
             const monthNameA = a.split(' ')[0];
            const yearA = parseInt(a.split(' ')[1]);
            const monthNameB = b.split(' ')[0];
            const yearB = parseInt(b.split(' ')[1]);
            const dateA = new Date(yearA, bulanNames.indexOf(monthNameA));
            const dateB = new Date(yearB, bulanNames.indexOf(monthNameB));
            return dateB.getTime() - dateA.getTime();
        });
        
        const sortedGroupedIuran: typeof grouped = {};
        for (const key of sortedMonthKeys) {
            sortedGroupedIuran[key] = grouped[key];
        }


        return {
            groupedIuran: sortedGroupedIuran,
            grandTotalIuran: { lingkungan: grandTotalLingkungan, sosial: grandTotalSosial, masjid: grandTotalMasjid, total: grandTotal }
        };
    }, [filteredData, type]);


    const { groupedPengeluaran, grandTotalPengeluaran } = useMemo(() => {
        if (type !== 'pengeluaran' || !filteredData) {
            return { groupedPengeluaran: {}, grandTotalPengeluaran: 0 };
        }

        const grouped: { [key: string]: { items: Pengeluaran[], subtotal: number } } = {};
        let grandTotal = 0;

        const sortedData = (filteredData as Pengeluaran[]).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

        for (const item of sortedData) {
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
    
    const { groupedWarga, totalWarga } = useMemo(() => {
        if (type !== 'warga' || !filteredData) {
            return { groupedWarga: {}, totalWarga: 0 };
        }

        const sortedData = (filteredData as Warga[]).sort((a, b) => {
            const blokCompare = (a.blok || '').localeCompare(b.blok || '');
            if (blokCompare !== 0) {
                return blokCompare;
            }
            
            // Try parsing norumah as numbers for smarter sorting
            const norumahA = parseInt(a.norumah, 10);
            const norumahB = parseInt(b.norumah, 10);
            if (!isNaN(norumahA) && !isNaN(norumahB)) {
                return norumahA - norumahB;
            }

            // Fallback to string comparison if not a number
            return a.norumah.localeCompare(b.norumah);
        });

        const grouped: { [blokKey: string]: Warga[] } = {};

        for (const item of sortedData) {
            const blokKey = item.blok || 'Lainnya';
            if (!grouped[blokKey]) {
                grouped[blokKey] = [];
            }
            grouped[blokKey].push(item);
        }

        return { groupedWarga: grouped, totalWarga: sortedData.length };

    }, [filteredData, type]);

    const { groupedKeluarga, totalAnggota } = useMemo(() => {
        if (type !== 'keluarga' || !filteredData) {
            return { groupedKeluarga: {}, totalAnggota: 0 };
        }

        const getBlokFromAlamat = (alamat: string | undefined): string => {
            if (!alamat) return 'Lainnya';
            const match = alamat.match(/Blok\s([A-Z0-9]+)/);
            return match ? match[1] : 'Lainnya';
        };

        const sortedData = (filteredData as AnggotaKeluargaWithInfo[]).sort((a, b) => {
            const blokA = getBlokFromAlamat(a.alamat);
            const blokB = getBlokFromAlamat(b.alamat);
            const blokCompare = blokA.localeCompare(blokB);
            if (blokCompare !== 0) {
                return blokCompare;
            }
            return (a.nama || '').localeCompare(b.nama || '');
        });

        const grouped: { [blokKey: string]: AnggotaKeluargaWithInfo[] } = {};

        for (const item of sortedData) {
            const blokKey = getBlokFromAlamat(item.alamat);
            if (!grouped[blokKey]) {
                grouped[blokKey] = [];
            }
            grouped[blokKey].push(item);
        }

        return { groupedKeluarga: grouped, totalAnggota: sortedData.length };
    }, [filteredData, type]);


    const renderHeaders = () => {
        switch (type) {
            case 'iuran': return (
                <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Blok/No</TableHead>
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
                    <TableHead>Kepala Keluarga</TableHead>
                    <TableHead>Nama Anggota</TableHead>
                    <TableHead>Hubungan</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
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
                return Object.entries(groupedIuran).map(([monthKey, monthGroup]) => (
                    <React.Fragment key={monthKey}>
                        <TableRow className="bg-secondary hover:bg-secondary">
                            <TableCell colSpan={8} className="font-extrabold text-lg text-secondary-foreground">{monthKey}</TableCell>
                        </TableRow>
                        {Object.keys(monthGroup.blok).sort().map(blokKey => {
                            const blokGroup = monthGroup.blok[blokKey];
                            return (
                                <React.Fragment key={blokKey}>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell colSpan={8} className="font-bold pl-8">Blok {blokKey}</TableCell>
                                    </TableRow>
                                    {blokGroup.items.map(item => (
                                        <TableRow key={item.iuranId}>
                                            <TableCell className="pl-8">{item.nama}</TableCell>
                                            <TableCell>{item.bulan} {item.tahun}</TableCell>
                                            <TableCell>{item.blok}/{item.norumah}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(item.iuranLingkungan)}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(item.iuranSosial)}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(item.iuranMasjid)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatRupiah(item.totalIuran)}</TableCell>
                                            <TableCell>{item.status}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 hover:bg-muted/50 font-bold">
                                        <TableCell colSpan={3} className="text-right">Subtotal Blok {blokKey}</TableCell>
                                        <TableCell className="text-right">{formatRupiah(blokGroup.subtotalLingkungan)}</TableCell>
                                        <TableCell className="text-right">{formatRupiah(blokGroup.subtotalSosial)}</TableCell>
                                        <TableCell className="text-right">{formatRupiah(blokGroup.subtotalMasjid)}</TableCell>
                                        <TableCell className="text-right">{formatRupiah(blokGroup.subtotalTotal)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </React.Fragment>
                            )
                        })}
                         <TableRow className="bg-secondary/70 hover:bg-secondary/70 font-bold text-base">
                            <TableCell colSpan={3} className="text-right">Total {monthKey}</TableCell>
                            <TableCell className="text-right">{formatRupiah(monthGroup.monthSubtotalLingkungan)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(monthGroup.monthSubtotalSosial)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(monthGroup.monthSubtotalMasjid)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(monthGroup.monthSubtotalTotal)}</TableCell>
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
            case 'warga':
                return Object.entries(groupedWarga).map(([blok, wargaList]) => (
                    <React.Fragment key={blok}>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={5} className="font-bold">
                                Blok {blok} ({wargaList.length} Warga)
                            </TableCell>
                        </TableRow>
                        {(wargaList as Warga[]).map(item => (
                             <TableRow key={item.wargaId}>
                                <TableCell className="pl-8">{item.nama}</TableCell>
                                <TableCell>{item.blok}/{item.norumah}</TableCell>
                                <TableCell>{item.statustempattinggal}</TableCell>
                                <TableCell>{item.statusktp}</TableCell>
                                <TableCell>{item.phone}</TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
                ));
            case 'keluarga': 
                return Object.entries(groupedKeluarga).map(([blok, anggotaList]) => (
                    <React.Fragment key={blok}>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={5} className="font-bold">
                                Blok {blok} ({anggotaList.length} Anggota)
                            </TableCell>
                        </TableRow>
                        {(anggotaList as AnggotaKeluargaWithInfo[]).map(item => (
                             <TableRow key={item.anggotaId}>
                                <TableCell className="pl-8">{item.kepalaKeluarga}</TableCell>
                                <TableCell>{item.nama}</TableCell>
                                <TableCell>{item.hubungan}</TableCell>
                                <TableCell>{item.jeniskelamin}</TableCell>
                                <TableCell>{formatDate(item.tanggallahir)}</TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
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
                 {type === 'warga' && totalWarga > 0 && (
                    <TableFooter>
                        <TableRow className="bg-primary/20 hover:bg-primary/25 font-bold text-base">
                            <TableCell colSpan={4} className="text-right">TOTAL SEMUA BLOK</TableCell>
                            <TableCell className="text-left font-bold">{totalWarga} Warga</TableCell>
                        </TableRow>
                    </TableFooter>
                )}
                {type === 'keluarga' && totalAnggota > 0 && (
                    <TableFooter>
                        <TableRow className="bg-primary/20 hover:bg-primary/25 font-bold text-base">
                            <TableCell colSpan={4} className="text-right">TOTAL SEMUA BLOK</TableCell>
                            <TableCell className="text-left font-bold">{totalAnggota} Anggota</TableCell>
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </div>
    );
}
