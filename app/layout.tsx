import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Apex CRM | Omnichannel CRM & Real-Time Sales Hub',
  description: 'Production-grade enterprise CRM sharing real-time Supabase Postgres backend with Flutter mobile app.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            {children}
            <Toaster position="top-right" richColors />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
