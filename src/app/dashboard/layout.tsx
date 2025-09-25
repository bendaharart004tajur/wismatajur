'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
       <div className="flex h-screen w-full items-stretch">
        <Skeleton className="hidden md:block md:w-64" />
        <div className="flex-1 flex flex-col">
            <header className="flex h-16 items-center justify-end border-b px-4 sm:px-6 lg:px-8">
              <Skeleton className="h-9 w-9 rounded-full" />
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
               <Skeleton className="h-full w-full" />
            </main>
        </div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
