import Link from 'next/link'
import { ArrowRight, BarChart3, Users, KanbanSquare, PhoneCall, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur sticky top-0 z-40 bg-background/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm">
            C
          </div>
          <span className="font-semibold text-lg tracking-tight">Sales CRM</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
              Open Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Streamlined Sales & Lead Management
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          Manage your customer relationships, track pipeline stages, log calls, and coordinate tasks with your sales team in one unified platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 shadow-sm">
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/contacts">
            <Button variant="outline" size="lg" className="px-6">
              View Contacts
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-xl border bg-card/60 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Contacts & Leads</h3>
            <p className="text-xs text-muted-foreground">
              Track leads through every stage of the funnel with complete contact details and interaction history.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card/60 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Deals & Pipeline</h3>
            <p className="text-xs text-muted-foreground">
              Interactive Kanban board to track deal values in ₹ (INR), probability, and stage transitions.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card/60 shadow-sm">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <PhoneCall className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Call Logs & Tasks</h3>
            <p className="text-xs text-muted-foreground">
              Integrated click-to-dial phone dialer, call duration records, and daily task management.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground">
        Sales CRM • Clean, Production-Grade Management System
      </footer>
    </div>
  )
}
