"use client"

import type React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { GovConnectSidebar } from "@/components/dashboard/GovConnectSidebar"
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar"
import { RealtimeProvider } from "@/components/dashboard/RealtimeProvider"
import { UrgentAlertBanner } from "@/components/dashboard/NotificationCenter"
import { LiveChatWidget } from "@/components/landing/LiveChatWidget"

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  return (
    <RealtimeProvider>
      <SidebarProvider>
        <GovConnectSidebar />
        <SidebarInset>
          <UrgentAlertBanner />
          <DashboardNavbar />
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
        {/* Live Chat Widget */}
        <LiveChatWidget />
      </SidebarProvider>
    </RealtimeProvider>
  )
}
