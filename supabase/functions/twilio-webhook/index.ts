import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Supabase Edge Function: Twilio Voice Webhook Receiver
 *
 * Receives webhook callbacks from Twilio Voice when calls start, answer, or complete.
 * Updates the shared Postgres `calls` and `activities` tables so that both
 * the Next.js CRM and the Flutter mobile app reflect call logs in real-time.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Twilio sends urlencoded form data or JSON
    const contentType = req.headers.get("content-type") || ""
    let body: Record<string, string> = {}

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData()
      formData.forEach((value, key) => {
        body[key] = value.toString()
      })
    } else {
      body = await req.json()
    }

    const {
      CallSid,
      From,
      To,
      CallStatus,
      CallDuration,
      RecordingUrl,
      Direction,
    } = body

    console.log(`[twilio-webhook] Received CallSid: ${CallSid}, Status: ${CallStatus}, Duration: ${CallDuration}s`)

    if (CallSid) {
      const durationSeconds = parseInt(CallDuration || "0", 10)

      // Upsert into shared calls table
      const { data: existingCall } = await supabase
        .from("calls")
        .select("id, contact_id, deal_id, user_id")
        .eq("provider_call_sid", CallSid)
        .maybeSingle()

      if (existingCall) {
        await supabase
          .from("calls")
          .update({
            status: CallStatus.toLowerCase(),
            duration_seconds: durationSeconds,
            recording_url: RecordingUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCall.id)
      } else {
        // Find matching contact by phone number
        const { data: contact } = await supabase
          .from("contacts")
          .select("id, assigned_to")
          .eq("phone", To)
          .is("deleted_at", null)
          .maybeSingle()

        const { data: newCall } = await supabase
          .from("calls")
          .insert({
            provider: "twilio",
            provider_call_sid: CallSid,
            direction: Direction === "inbound" ? "inbound" : "outbound",
            from_number: From,
            to_number: To,
            status: CallStatus.toLowerCase(),
            duration_seconds: durationSeconds,
            recording_url: RecordingUrl || null,
            contact_id: contact?.id || null,
            user_id: contact?.assigned_to || null,
            outcome: durationSeconds > 0 ? "connected_interested" : "no-answer",
          })
          .select()
          .single()

        // Create activity record for contact timeline
        if (contact?.id && newCall) {
          await supabase.from("activities").insert({
            type: "call",
            title: `Twilio ${Direction === "inbound" ? "Inbound" : "Outbound"} Call`,
            description: `Call duration: ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s. Status: ${CallStatus}`,
            contact_id: contact.id,
            user_id: contact.assigned_to || null,
          })
        }
      }
    }

    // Return TwiML response or JSON
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`

    return new Response(twimlResponse, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
      status: 200,
    })
  } catch (err: any) {
    console.error("[twilio-webhook] Error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
