"use client"

import React, { useState, useEffect } from 'react'
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatDateTime, formatDate } from '@/lib/utils'
import { useSupabase } from '@/components/providers/supabase-provider'
import { usePermissions } from '@/hooks/use-permission'
import { toast } from 'sonner'
import type { Task } from '@/types'

const initialTasks = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    title: 'Follow up on SLA questions with Sarah Jenkins',
    description: 'Review SLA uptime guarantees and share disaster recovery documentation.',
    type: 'call',
    priority: 'high',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    is_completed: false,
    contact_name: 'Sarah Jenkins',
    assigned_to: 'Alex Morgan',
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    title: 'Prepare FinTech Integration Deck',
    description: 'Customize API latency benchmarks for Michael Chang.',
    type: 'todo',
    priority: 'medium',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    is_completed: false,
    contact_name: 'Michael Chang',
    assigned_to: 'Sarah Jenkins',
  },
  {
    id: '50000000-0000-0000-0000-000000000003',
    title: 'Legal contract final review with Elena',
    description: 'Schedule 30-min call to finalize data protection addendum.',
    type: 'meeting',
    priority: 'urgent',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    is_completed: false,
    contact_name: 'Elena Rostova',
    assigned_to: 'Alex Morgan',
  },
  {
    id: '50000000-0000-0000-0000-000000000004',
    title: 'Send monthly newsletter campaign recap',
    description: 'Review click-through metrics on Q3 security webinar.',
    type: 'email',
    priority: 'low',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    is_completed: true,
    contact_name: 'David Kowalski',
    assigned_to: 'David Miller',
  },
]

export default function TasksPage() {
  const { supabase } = useSupabase()
  const { can } = usePermissions()

  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [contactName, setContactName] = useState('')

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.is_completed
    if (filter === 'completed') return t.is_completed
    return true
  })

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = !t.is_completed
          toast.success(updated ? 'Task marked as completed' : 'Task marked as pending')
          return { ...t, is_completed: updated }
        }
        return t
      })
    )
  }

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      toast.error('Task title is required')
      return
    }

    const newTask = {
      id: Math.random().toString(),
      title,
      description,
      type,
      priority,
      due_date: dueDate || new Date(Date.now() + 86400000).toISOString(),
      is_completed: false,
      contact_name: contactName || 'General',
      assigned_to: 'Alex Morgan',
    }

    setTasks((prev) => [newTask, ...prev])
    toast.success('Task created and push notification dispatched to mobile assignee')

    setTitle('')
    setDescription('')
    setDueDate('')
    setContactName('')
    setIsAddOpen(false)
  }

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>
      case 'high':
        return <Badge variant="warning">High</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>
      default:
        return <Badge variant="outline">Low</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" /> Tasks & Follow-ups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track daily action items, call reminders, and auto-dispatched FCM push alerts.
          </p>
        </div>

        {can('tasks', 'create') && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs shadow-sm">
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Tasks assigned to team members automatically trigger push notifications to their mobile device.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateTask} className="space-y-3 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Task Title *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Call client regarding proposal"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="call">Call</option>
                      <option value="meeting">Meeting</option>
                      <option value="email">Email</option>
                      <option value="todo">To-Do</option>
                      <option value="follow_up">Follow Up</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Linked Contact</label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Sarah Jenkins"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional context or checklist items..."
                    className="w-full h-16 rounded-md border border-input bg-background p-2 text-xs resize-none"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs h-8"
        >
          All ({tasks.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
          className="text-xs h-8"
        >
          Pending ({tasks.filter((t) => !t.is_completed).length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
          className="text-xs h-8"
        >
          Completed ({tasks.filter((t) => t.is_completed).length})
        </Button>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className={`shadow-sm transition-all ${
              task.is_completed ? 'opacity-60 bg-muted/30' : 'hover:shadow-md'
            }`}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 text-primary hover:scale-110 transition-transform"
              >
                {task.is_completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h3
                    className={`font-semibold text-sm text-foreground ${
                      task.is_completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                )}

                <div className="mt-2.5 flex items-center gap-4 text-[11px] text-muted-foreground">
                  {task.contact_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {task.contact_name}
                    </span>
                  )}
                  <span>Assigned: <strong>{task.assigned_to}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
