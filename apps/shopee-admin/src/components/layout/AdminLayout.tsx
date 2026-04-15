import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from 'src/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { ErrorBoundary } from 'src/components/shared/ErrorBoundary'
import { CommandPalette } from 'src/components/shared/CommandPalette'
import { useKeyboardShortcuts } from 'src/hooks/use-keyboard-shortcuts'

export default function AdminLayout() {
  useKeyboardShortcuts()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  )
}
