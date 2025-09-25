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
       <div className="flex h-screen w-screen items-center justify-center p-4">
        <div className="flex w-full h-full gap-4">
            <Skeleton className="hidden md:block md:w-64 rounded-lg" />
            <div className="flex-1 space-y-4">
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-[calc(100vh-8rem)] w-full rounded-lg" />
            </div>
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
