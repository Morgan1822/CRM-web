"use client"

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DialerPanel } from '@/components/layout/dialer-panel'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDialerOpen, setIsDialerOpen] = useState(false)
  const [dialerTarget, setDialerTarget] = useState<{
    phone?: string
    name?: string
    contactId?: string
  }>({})

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onOpenDialer={() => setIsDialerOpen(true)} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Floating Click-to-Call Dialer Panel */}
      <DialerPanel
        isOpen={isDialerOpen}
        onClose={() => setIsDialerOpen(false)}
        initialPhoneNumber={dialerTarget.phone}
        contactName={dialerTarget.name}
        contactId={dialerTarget.contactId}
      />
    </div>
  )
}
