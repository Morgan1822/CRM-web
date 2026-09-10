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

  // Expose global helper for click-to-call across contacts/deals
  const handleTriggerCall = (phone: string, name?: string, contactId?: string) => {
    setDialerTarget({ phone, name, contactId })
    setIsDialerOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenDialer={() => setIsDialerOpen(true)} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
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
