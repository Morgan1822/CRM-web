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
  Trash2,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

export default function TasksPage() {
  const { supabase, user } = useSupabase()
  const { can } = usePermissions()

  const [tasks, setTasks] = useState<any[]>([])
  const [contactsList, setContactsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [contactId, setContactId] = useState('')

  const loadTasksAndContacts = async () => {
    try {
      const [tasksRes, contactsRes] = await Promise.all([
        (supabase.from('tasks') as any)
          .select(`
            *,
            contact:contacts(first_name, last_name)
          `)
          .order('due_date', { ascending: true }),
        (supabase.from('contacts') as any)
          .select('id, first_name, last_name')
          .order('first_name')
      ])

      if (tasksRes.data) {
        setTasks(tasksRes.data)
      }
      if (contactsRes.data) {
        setContactsList(contactsRes.data)
      }
    } catch (e) {
      console.error('Failed to load tasks:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasksAndContacts()

    const channel = supabase
      .channel('tasks_realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasksAndContacts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.is_completed
    if (filter === 'completed') return t.is_completed
    return true
  })

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      const nextCompleted = !currentCompleted
      const { error } = await (supabase.from('tasks') as any)
        .update({ is_completed: nextCompleted, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: nextCompleted } : t))
      )
      toast.success(nextCompleted ? 'Task completed' : 'Task marked pending')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await (supabase.from('tasks') as any)
        .delete()
        .eq('id', taskId)

      if (error) throw error
      toast.success('Task removed')
      await loadTasksAndContacts()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete task')
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      toast.error('Task title is required')
      return
    }

    try {
      const { error } = await (supabase.from('tasks') as any)
        .insert([
          {
            title,
            description: description || null,
            type,
            priority,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            is_completed: false,
            contact_id: contactId || null,
            assigned_to: user?.id || null,
          },
        ])

      if (error) throw error

      toast.success('Task created successfully')
      await loadTasksAndContacts()

      setTitle('')
      setDescription('')
      setDueDate('')
      setContactId('')
      setIsAddOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to create task')
    }
  }

  const getPriorityBadge = (p: string) => {
    const pr = (p || 'medium').toLowerCase()
    switch (pr) {
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
            Track daily action items, reminders, and customer follow-ups.
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
                  Add a task or follow-up item.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateTask} className="space-y-3 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Task Title *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Call client for follow-up"
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
                    <select
                      value={contactId}
                      onChange={(e) => setContactId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="">-- None (General) --</option>
                      {contactsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details or notes..."
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
      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="p-8 text-center text-xs text-muted-foreground">
          No tasks found. Click "+ Add Task" to create a task.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const contactName = task.contact ? `${task.contact.first_name} ${task.contact.last_name || ''}`.trim() : null

            return (
              <Card
                key={task.id}
                className={`shadow-sm transition-all ${
                  task.is_completed ? 'opacity-60 bg-muted/30' : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <button
                    onClick={() => toggleTask(task.id, task.is_completed)}
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
                          <Calendar className="h-3 w-3" /> {task.due_date ? formatDate(task.due_date) : 'No due date'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                    )}

                    {contactName && (
                      <div className="mt-2.5 flex items-center gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {contactName}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
