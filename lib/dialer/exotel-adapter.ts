import { IDialerProvider, CallPayload, CallStatus } from './types'

/**
 * Exotel Dialer Adapter (Alternative Telephony Provider)
 *
 * To swap Exotel as the active provider:
 * 1. Set NEXT_PUBLIC_DIALER_PROVIDER=exotel in .env.local
 * 2. In lib/dialer/index.ts, return new ExotelDialerAdapter()
 */
export class ExotelDialerAdapter implements IDialerProvider {
  name = 'exotel' as const
  private onStatusChangeCallback?: (status: CallStatus) => void

  constructor(onStatusChange?: (status: CallStatus) => void) {
    this.onStatusChangeCallback = onStatusChange
  }

  async initialize(token: string): Promise<void> {
    console.log('[ExotelDialerAdapter] Initialized with Exotel API credentials')
  }

  async makeCall(payload: CallPayload): Promise<{ callSid: string }> {
    console.log(`[ExotelDialerAdapter] Initiating Exotel outbound call to ${payload.toNumber}...`)
    this.onStatusChangeCallback?.('connecting')

    const simulatedSid = 'EXO_' + Math.random().toString(36).substring(2, 15)

    setTimeout(() => {
      this.onStatusChangeCallback?.('in-progress')
    }, 1500)

    return { callSid: simulatedSid }
  }

  async hangup(): Promise<void> {
    console.log('[ExotelDialerAdapter] Exotel call terminated')
    this.onStatusChangeCallback?.('completed')
  }

  mute(isMuted: boolean): void {
    console.log(`[ExotelDialerAdapter] Exotel call mute state: ${isMuted}`)
  }

  sendDigits(digits: string): void {
    console.log(`[ExotelDialerAdapter] Exotel DTMF tone: ${digits}`)
  }
}
