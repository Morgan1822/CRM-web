# Firebase Cloud Messaging (FCM) Push Notifications Setup

This Supabase Edge Function (`push-dispatcher`) sends real-time push notifications to the companion Flutter mobile app (iOS and Android) whenever leads, tasks, or calls are assigned.

---

## 1. Firebase Console Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your Firebase Project (which is connected to your Flutter mobile app).
3. Navigate to **Project Settings** (gear icon) -> **Service Accounts**.
4. Click **Generate New Private Key**. A JSON file containing your service account credentials will be downloaded (e.g. `your-project-firebase-adminsdk-xxx.json`).

---

## 2. Setting Supabase Edge Function Secrets

In your terminal (inside the CRM project directory):

```bash
# Set the Firebase service account JSON as a Supabase Secret
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com"}'
```

Or paste the JSON string in the **Supabase Dashboard** under **Project Settings -> Edge Functions -> Secrets**.

---

## 3. Registering Supabase Database Webhooks

In the Supabase Dashboard:
1. Navigate to **Database -> Webhooks**.
2. Click **Create a new webhook**.
3. Set table to `contacts` (Events: `INSERT`, `UPDATE`).
4. Select webhook target: **Supabase Edge Function** -> `push-dispatcher`.
5. Repeat for `tasks` and `calls` tables.

---

## 4. Mobile App Token Registration

When the Flutter app launches and requests notification permissions:
```dart
// Flutter FCM token registration snippet
final fcmToken = await FirebaseMessaging.instance.getToken();
await supabase.from('device_tokens').upsert({
  'user_id': supabase.auth.currentUser!.id,
  'token': fcmToken,
  'platform': Platform.isIOS ? 'ios' : 'android',
  'last_seen_at': DateTime.now().toIso8601String(),
});
```
