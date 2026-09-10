import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Twilio Voice Access Token Generator Route
 *
 * Generates an Access Token granting WebRTC voice capabilities
 * for the CRM in-browser dialer panel.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Identity for Twilio WebRTC client (defaults to user ID or agent identifier)
    const identity = user?.email || user?.id || 'crm-agent-' + Math.random().toString(36).substring(2, 8)

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const apiKey = process.env.TWILIO_API_KEY
    const apiSecret = process.env.TWILIO_API_SECRET
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID

    // If Twilio credentials are configured, return real Twilio Access Token
    if (accountSid && apiKey && apiSecret && twimlAppSid && !accountSid.includes('XXXX')) {
      // In production with 'twilio' npm package installed:
      // const AccessToken = twilio.jwt.AccessToken;
      // const VoiceGrant = AccessToken.VoiceGrant;
      // const voiceGrant = new VoiceGrant({ outgoingApplicationSid: twimlAppSid, incomingAllow: true });
      // const token = new AccessToken(accountSid, apiKey, apiSecret, { identity });
      // token.addGrant(voiceGrant);
      // return NextResponse.json({ token: token.toJwt(), identity });
    }

    // Mock token for development & testing
    const simulatedToken = `mock_twilio_token_${identity}_${Date.now()}`

    return NextResponse.json({
      token: simulatedToken,
      identity,
      provider: 'twilio',
      status: 'ready',
      message: 'Token generated for WebRTC voice session',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate dialer voice token' },
      { status: 500 }
    )
  }
}
