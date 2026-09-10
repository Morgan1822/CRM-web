export type DialerProviderType = 'twilio' | 'exotel' | 'custom'

export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer'

export interface CallPayload {
  toNumber: string
  fromNumber?: string
  contactId?: string
  dealId?: string
  contactName?: string
}

export interface CallLogEntry {
  id?: string
  contact_id?: string | null
  deal_id?: string | null
  user_id?: string | null
  provider: DialerProviderType
  provider_call_sid?: string | null
  direction: 'inbound' | 'outbound'
  from_number?: string | null
  to_number: string
  status: CallStatus
  duration_seconds: number
  recording_url?: string | null
  notes?: string | null
  outcome?: string | null
}

export interface IDialerProvider {
  name: DialerProviderType
  initialize: (token: string) => Promise<void>
  makeCall: (payload: CallPayload) => Promise<{ callSid: string }>
  hangup: () => Promise<void>
  mute: (isMuted: boolean) => void
  sendDigits: (digits: string) => void
}
