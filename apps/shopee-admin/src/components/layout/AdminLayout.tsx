import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { SidebarProvider, SidebarInset } from 'src/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { ErrorBoundary } from 'src/components/shared/ErrorBoundary'
import { CommandPalette } from 'src/components/shared/CommandPalette'
import { PageTransition } from 'src/components/shared/PageTransition'
import { useKeyboardShortcuts } from 'src/hooks/use-keyboard-shortcuts'

export default function AdminLayout() {
  useKeyboardShortcuts()
  const location = useLocation()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <ErrorBoundary>
            <AnimatePresence mode="sync">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  )
}

