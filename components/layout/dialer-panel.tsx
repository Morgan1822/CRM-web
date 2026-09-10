"use client"

import React, { useState, useEffect } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Delete, X, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createDialer, CallStatus } from '@/lib/dialer'
import { useSupabase } from '@/components/providers/supabase-provider'
import { toast } from 'sonner'

interface DialerPanelProps {
  isOpen: boolean
  onClose: () => void
  initialPhoneNumber?: string
  contactName?: string
  contactId?: string
}

export function DialerPanel({
  isOpen,
  onClose,
  initialPhoneNumber = '',
  contactName = '',
  contactId = '',
}: DialerPanelProps) {
  const { supabase, user } = useSupabase()
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [callNotes, setCallNotes] = useState('')
  const [activeCallId, setActiveCallId] = useState<string | null>(null)

  const [dialer] = useState(() =>
    createDialer((status) => {
      setCallStatus(status)
      if (status === 'completed') {
        toast.info('Call ended')
      }
    })
  )

  useEffect(() => {
    if (initialPhoneNumber) {
      setPhoneNumber(initialPhoneNumber)
    }
  }, [initialPhoneNumber])

  // Call timer interval
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (callStatus === 'in-progress') {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [callStatus])

  if (!isOpen) return null

  const handleDigitPress = (digit: string) => {
    setPhoneNumber((prev) => prev + digit)
    dialer.sendDigits(digit)
  }

  const handleDeleteDigit = () => {
    setPhoneNumber((prev) => prev.slice(0, -1))
  }

  const handleStartCall = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number to call')
      return
    }

    try {
      setDuration(0)
      setCallStatus('connecting')
      const { callSid } = await dialer.makeCall({
        toNumber: phoneNumber,
        contactId: contactId || undefined,
        contactName: contactName || undefined,
      })

      // Log call into shared Supabase Postgres database
      try {
        const { data: callLog } = await (supabase.from('calls') as any)
          .insert([
            {
              contact_id: contactId || null,
              user_id: user?.id || null,
              provider: 'twilio',
              provider_call_sid: callSid,
              direction: 'outbound',
              from_number: '+1 (555) 000-1111',
              to_number: phoneNumber,
              status: 'in-progress',
              duration_seconds: 0,
              outcome: 'connected_interested',
            },
          ])
          .select()
          .single()

        if (callLog) {
          setActiveCallId(callLog.id)
        }
      } catch (e) {
        console.log('Local call logged in state')
      }

      toast.success(`Calling ${contactName || phoneNumber}...`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate call')
      setCallStatus('failed')
    }
  }

  const handleEndCall = async () => {
    await dialer.hangup()
    setCallStatus('completed')

    // Update call duration and notes in database
    if (activeCallId) {
      try {
        await (supabase.from('calls') as any)
          .update({
            status: 'completed',
            duration_seconds: duration,
            notes: callNotes || 'Call completed from Web CRM.',
          })
          .eq('id', activeCallId)
      } catch (e) {
        console.error('Failed to update call record:', e)
      }
    }
  }

  const handleToggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    dialer.mute(nextMuted)
  }

  const formatSeconds = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const keypadButtons = [
    ['1', ''],
    ['2', 'ABC'],
    ['3', 'DEF'],
    ['4', 'GHI'],
    ['5', 'JKL'],
    ['6', 'MNO'],
    ['7', 'PQRS'],
    ['8', 'TUV'],
    ['9', 'WXYZ'],
    ['*', ''],
    ['0', '+'],
    ['#', ''],
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
      {/* Dialer Header */}
      <div className="bg-primary px-4 py-3 text-primary-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <span className="font-semibold text-xs tracking-wide">Twilio Voice Dialer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary-foreground/20 text-primary-foreground border-none">
            {callStatus.toUpperCase()}
          </Badge>
          <button onClick={onClose} className="p-1 hover:bg-primary-foreground/20 rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Recipient / Caller ID Display */}
        {contactName && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{contactName}</span>
          </div>
        )}

        {/* Number Display & Timer */}
        <div className="text-center py-2 border-b border-border/60">
          <Input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="text-center text-lg font-semibold tracking-wider border-none bg-transparent focus-visible:ring-0"
            disabled={callStatus === 'in-progress' || callStatus === 'connecting'}
          />
          {callStatus === 'in-progress' && (
            <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 animate-pulse">
              ● {formatSeconds(duration)}
            </div>
          )}
        </div>

        {/* Keypad Grid (when idle) */}
        {callStatus === 'idle' && (
          <div className="grid grid-cols-3 gap-2">
            {keypadButtons.map(([num, letters]) => (
              <button
                key={num}
                onClick={() => handleDigitPress(num)}
                className="h-11 rounded-lg border border-border/80 bg-background hover:bg-accent flex flex-col items-center justify-center transition-colors active:scale-95"
              >
                <span className="text-sm font-semibold">{num}</span>
                {letters && <span className="text-[8px] text-muted-foreground tracking-tighter">{letters}</span>}
              </button>
            ))}
          </div>
        )}

        {/* In-Call Controls */}
        {callStatus === 'in-progress' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={isMuted ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleToggleMute}
                className="rounded-full h-10 w-10 p-0"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Call Notes:</label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Log call outcome and notes..."
                className="w-full mt-1 p-2 text-xs rounded-md border border-input bg-transparent resize-none h-16"
              />
            </div>
          </div>
        )}

        {/* Post-Call Summary State */}
        {callStatus === 'completed' && (
          <div className="text-center space-y-2 py-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold">Call Logged Successfully</p>
            <p className="text-[11px] text-muted-foreground">
              Duration: {formatSeconds(duration)}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setCallStatus('idle')
                setDuration(0)
                setCallNotes('')
              }}
            >
              Start New Call
            </Button>
          </div>
        )}

        {/* Main Call / Hangup Trigger */}
        {callStatus !== 'completed' && (
          <div className="flex items-center gap-2">
            {callStatus === 'idle' && (
              <>
                <Button
                  onClick={handleStartCall}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold h-10"
                >
                  <Phone className="h-4 w-4" /> Call
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteDigit}
                  className="h-10 w-10 text-muted-foreground hover:text-foreground"
                >
                  <Delete className="h-4 w-4" />
                </Button>
              </>
            )}

            {(callStatus === 'connecting' || callStatus === 'in-progress') && (
              <Button
                onClick={handleEndCall}
                className="w-full bg-destructive hover:bg-destructive/90 text-white gap-2 text-xs font-semibold h-10"
              >
                <PhoneOff className="h-4 w-4" /> End Call
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
