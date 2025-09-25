'use client'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/layout/user-nav"
import { useSidebar } from "@/components/ui/sidebar"

export default function Header() {
  const { isMobile } = useSidebar()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
       {isMobile ? <SidebarTrigger /> : <div />}
      <div className="flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  )
}
