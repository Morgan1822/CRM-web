import Link from 'next/link'
import { ArrowRight, Shield, Zap, Smartphone, PhoneCall, Users, BarChart3, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
            A
          </div>
          <span className="font-semibold text-lg tracking-tight">Apex CRM</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium ml-2">
            Shared Supabase Backend
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
              Open App <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-6">
          <Zap className="h-3.5 w-3.5" /> Next.js 14 Web CRM & Flutter Mobile Architecture
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mb-6 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
          The High-Performance CRM for Fast-Moving Sales Teams
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          Integrated directly with your shared Supabase Postgres database. Manage leads, pipeline stages, click-to-call dialer, and dispatch FCM push notifications to your Flutter mobile app in real-time.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 shadow-md">
              Launch Web CRM <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/contacts">
            <Button variant="outline" size="lg" className="px-6">
              View Contacts & Pipeline
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-xl border bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">Shared Supabase Postgres</h3>
            <p className="text-sm text-muted-foreground">
              Single source of truth with Row Level Security, soft deletes, and live Postgres replication across Web and Mobile.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
              <PhoneCall className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">Integrated Dialer</h3>
            <p className="text-sm text-muted-foreground">
              WebRTC click-to-dial with Twilio Voice support, real-time call duration logging, and automatic activity history.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">Mobile Push Dispatcher</h3>
            <p className="text-sm text-muted-foreground">
              Supabase Edge Functions send instant FCM notifications to Flutter iOS and Android devices on lead and task events.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground">
        Apex CRM • Built with Next.js 14, Tailwind CSS, Supabase SSR & Twilio Voice
      </footer>
    </div>
  )
}
