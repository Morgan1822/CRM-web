import { IDialerProvider, CallPayload, CallStatus } from './types'

/**
 * Twilio WebRTC Voice Adapter
 *
 * NOTE: To switch to an alternate dialer provider (such as Exotel or AWS Connect):
 * 1. Implement IDialerProvider interface in a new adapter file (e.g. exotel-adapter.ts)
 * 2. Update the default export in lib/dialer/index.ts
 */
export class TwilioDialerAdapter implements IDialerProvider {
  name = 'twilio' as const
  private isInitialized = false
  private activeCall: any = null
  private onStatusChangeCallback?: (status: CallStatus) => void

  constructor(onStatusChange?: (status: CallStatus) => void) {
    this.onStatusChangeCallback = onStatusChange
  }

  async initialize(token: string): Promise<void> {
    if (typeof window === 'undefined') return
    // In production: dynamically load @twilio/voice-sdk if installed or use WebRTC device
    console.log('[TwilioDialerAdapter] Initialized with capability token')
    this.isInitialized = true
  }

  async makeCall(payload: CallPayload): Promise<{ callSid: string }> {
    console.log(`[TwilioDialerAdapter] Calling ${payload.toNumber} for contact ${payload.contactName || payload.contactId}...`)
    this.onStatusChangeCallback?.('connecting')

    // Simulate connection / Twilio Voice Device.connect({ params: { To: payload.toNumber } })
    const simulatedSid = 'CA' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    setTimeout(() => {
      this.onStatusChangeCallback?.('in-progress')
    }, 1500)

    return { callSid: simulatedSid }
  }

  async hangup(): Promise<void> {
    console.log('[TwilioDialerAdapter] Call hung up')
    if (this.activeCall) {
      this.activeCall = null
    }
    this.onStatusChangeCallback?.('completed')
  }

  mute(isMuted: boolean): void {
    console.log(`[TwilioDialerAdapter] Audio ${isMuted ? 'muted' : 'unmuted'}`)
  }

  sendDigits(digits: string): void {
    console.log(`[TwilioDialerAdapter] Sent DTMF tone digits: ${digits}`)
  }
}
