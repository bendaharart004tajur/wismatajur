'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/logo';
import {
  LayoutDashboard, Users, UserSquare2, DollarSign, Wallet, Warehouse, Megaphone, Store, Dice5, UserCog, TrendingUp, FileText
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/laporan', label: 'Laporan', icon: FileText },
  { href: '/dashboard/warga', label: 'Warga', icon: Users, roles: ['Admin', 'Pengawas'] },
  { href: '/dashboard/anggota-keluarga', label: 'Anggota Keluarga', icon: UserSquare2, roles: ['Admin', 'Pengawas'] },
  { href: '/dashboard/iuran', label: 'Iuran', icon: DollarSign, roles: ['Admin', 'Pengawas'] },
  { href: '/dashboard/pendapatan', label: 'Pendapatan', icon: TrendingUp, roles: ['Admin', 'Pengawas'] },
  { href: '/dashboard/pengeluaran', label: 'Pengeluaran', icon: Wallet },
  { href: '/dashboard/inventaris', label: 'Inventaris', icon: Warehouse },
  { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { href: '/dashboard/umkm', label: 'UMKM', icon: Store },
  { href: '/dashboard/arisan', label: 'Arisan', icon: Dice5 },
  { href: '/dashboard/pengurus', label: 'Pengurus RT', icon: UserCog, roles: ['Admin', 'Pengawas'] },
];

export default function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.roles && user && !item.roles.includes(user.peran)) {
              return null;
            }
            return (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
