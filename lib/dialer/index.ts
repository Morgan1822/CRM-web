import { TwilioDialerAdapter } from './twilio-adapter'
import { IDialerProvider, CallStatus } from './types'

export * from './types'
export * from './twilio-adapter'

// Default dialer provider factory
export function createDialer(onStatusChange?: (status: CallStatus) => void): IDialerProvider {
  // Can conditionally return ExotelDialerAdapter or TwilioDialerAdapter based on env / tenant settings
  return new TwilioDialerAdapter(onStatusChange)
}
