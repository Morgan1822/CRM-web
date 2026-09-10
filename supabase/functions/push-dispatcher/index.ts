import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Supabase Edge Function: FCM Push Notification Dispatcher
 *
 * Triggered via Database Webhook when:
 * 1. A new lead/contact is assigned to a sales agent
 * 2. A task is created or updated for an agent
 * 3. A call is logged or requires follow-up
 *
 * Queries `device_tokens` table for registered Flutter iOS & Android tokens
 * and sends native push notifications using Firebase Cloud Messaging HTTP v1 API.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  schema: string
  record: Record<string, any>
  old_record: Record<string, any> | null
}

// Generate Google OAuth2 Access Token from Service Account Key for FCM HTTP v1
async function getGoogleAccessToken(serviceAccount: Record<string, any>): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 3600

  const header = { alg: "RS256", typ: "JWT" }
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: exp,
    iat: iat,
  }

  // Base64Url encoding
  const encodeB64Url = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

  const encodedHeader = encodeB64Url(header)
  const encodedClaim = encodeB64Url(claimSet)
  const unsignedToken = `${encodedHeader}.${encodedClaim}`

  // Import Private Key (PEM to CryptoKey)
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "")

  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken)
  )

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  const jwt = `${unsignedToken}.${encodedSignature}`

  // Exchange JWT for OAuth2 Access Token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenResponse.json()
  if (!tokenData.access_token) {
    throw new Error(`Failed to obtain Google access token: ${JSON.stringify(tokenData)}`)
  }

  return tokenData.access_token
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const rawServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const payload: WebhookPayload = await req.json()

    console.log(`[push-dispatcher] Webhook received for table: ${payload.table}, type: ${payload.type}`)

    let targetUserId: string | null = null
    let notificationTitle = "CRM Update"
    let notificationBody = "You have a new update in Apex CRM"
    let entityData: Record<string, string> = {
      table: payload.table,
      id: payload.record?.id || "",
    }

    // Determine notification context based on table event
    if (payload.table === "contacts") {
      targetUserId = payload.record?.assigned_to
      if (payload.type === "INSERT") {
        notificationTitle = "🔥 New Lead Assigned"
        notificationBody = `${payload.record.first_name} ${payload.record.last_name} (${payload.record.company || "New Lead"}) has been assigned to you.`
      }
    } else if (payload.table === "tasks") {
      targetUserId = payload.record?.assigned_to
      if (payload.type === "INSERT") {
        notificationTitle = "📋 New Task Assigned"
        notificationBody = `Task: "${payload.record.title}" is scheduled.`
      }
    } else if (payload.table === "calls") {
      targetUserId = payload.record?.user_id
      if (payload.record?.outcome === "follow_up_needed") {
        notificationTitle = "📞 Call Follow-Up Required"
        notificationBody = `Follow up needed for call with ${payload.record.to_number}`
      }
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ message: "No assigned user for push notification" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    // Fetch device tokens for the assigned user
    const { data: tokens, error: tokensError } = await supabase
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", targetUserId)

    if (tokensError || !tokens || tokens.length === 0) {
      console.log(`[push-dispatcher] No active mobile device tokens found for user: ${targetUserId}`)
      return new Response(
        JSON.stringify({ message: "No device tokens found for target user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    console.log(`[push-dispatcher] Found ${tokens.length} device tokens for user ${targetUserId}`)

    if (!rawServiceAccount) {
      console.warn("[push-dispatcher] FIREBASE_SERVICE_ACCOUNT not configured yet. Skipping FCM HTTP call.")
      return new Response(
        JSON.stringify({
          message: "FIREBASE_SERVICE_ACCOUNT secret not set. Ready for credential input.",
          tokens_count: tokens.length,
          preview: { title: notificationTitle, body: notificationBody },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    const serviceAccount = JSON.parse(rawServiceAccount)
    const accessToken = await getGoogleAccessToken(serviceAccount)
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

    // Dispatch FCM HTTP v1 request for each token
    const results = await Promise.all(
      tokens.map(async ({ token, platform }) => {
        const messagePayload = {
          message: {
            token: token,
            notification: {
              title: notificationTitle,
              body: notificationBody,
            },
            data: entityData,
            android: {
              priority: "high",
              notification: {
                sound: "default",
                channel_id: "crm_alerts",
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          },
        }

        const res = await fetch(fcmEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        })

        return { token: token.substring(0, 10) + "...", status: res.status }
      })
    )

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: any) {
    console.error("[push-dispatcher] Error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
