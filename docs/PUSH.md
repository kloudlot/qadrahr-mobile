# Push notifications

How a notification reaches a phone, and the one-off setup each environment needs.

## How it fits together

```
backend NotificationsService.notify()
  ├─ writes the in-app row (always)
  ├─ email, if the caller asked
  └─ push, unless the caller passed push:false or the user muted the category
       └─ ExpoPushAdapter → https://exp.host/--/api/v2/push/send
             ├─ Expo → APNs (iOS) / FCM (Android) → phone
             └─ 15 min later: push-receipts job → drops uninstalled devices
```

- **Tokens.** The app registers an Expo push token with `POST /me/notifications/devices`
  after sign-in, when it returns to the foreground (at most hourly), and when the OS rotates
  the token. One device per user, to match one session per user.
- **The server forgets the device when the session ends**, by any route: sign-out here or on
  the web, signing in anywhere else, the login being switched off, deactivation, or a password
  reset. A signed-out phone gets nothing.
- **What is pushed.** Every notification a user receives in-app, grouped into categories the
  user can mute in Me → Settings → Notifications (`GET|PUT /me/notifications/preferences`).
  Categories are defined once, in the backend's `src/notifications/notification-categories.ts`.
- **Lock screen.** A notification whose text is sensitive sets `pushTitle`/`pushBody` on the
  server. Payslips leave out net pay, and case updates name only the case reference.
- **Tapping** opens the screen from `lib/notificationTarget.ts` and marks the row read.
  Anything the app has no screen for opens Notifications.
- **Android channels** are `approvals`, `pay`, `announcements` and `general`, all at HIGH
  importance, which is what makes Android pop a heads-up banner. The ids must match
  `androidChannelFor` on the backend. The expo-notifications plugin's `defaultChannel:
  "general"` (app.config.ts) catches a push naming a channel the phone lacks.
  - **A channel's importance can't be raised once it exists on a phone.** To change one, add a
    new id and delete the old one; don't edit it in place. That is why the original `default`
    channel, created at DEFAULT importance (tray only, no banner), was retired.
- **App open.** The system banner is held back, and the app shows its own toast instead. Tapping
  the toast opens the notification exactly as tapping it in the tray does
  (`lib/openNotification.ts`). The bell refetches whenever the app returns to the foreground.

## Setup per environment (one-off)

Push needs credentials that only the account owner can create. Without them the app still
builds and runs, but no push arrives.

### Android: Firebase

1. In the [Firebase console](https://console.firebase.google.com), create a project, or reuse
   one. Add an Android app with package **`com.kloudlot.qadrahr`**.
2. Download `google-services.json`. **Do not commit it**; it is gitignored.
3. Give it to EAS as a file variable for each environment that builds for devices:
   ```sh
   eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json \
     --environment preview --environment production --visibility secret
   ```
   For a local `expo run:android`, set `GOOGLE_SERVICES_JSON=./google-services.json`.
4. Firebase → Project settings → Service accounts → **Generate new private key**. Then upload
   it to Expo:
   ```sh
   eas credentials --platform android
   # → production (or the profile) → Google Service Account
   # → Manage your Google Service Account Key for Push Notifications (FCM V1) → upload the JSON
   ```

### iOS: APNs

Requires an Apple Developer account.

```sh
eas credentials --platform ios
# → the profile → Push Notifications: Manage your Apple Push Notifications Key → set up
```

EAS can create the key for you. The next iOS build carries the push entitlement.

### Optional: enhanced push security

When "Enhanced push security" is on in the Expo project's settings, Expo refuses sends that
lack an access token. Create one at expo.dev → Account settings → Access tokens, and set it on
the API as `EXPO_ACCESS_TOKEN`.

## Checking it works

- **Without a device build:** the [Expo push tool](https://expo.dev/notifications) can send to
  a token copied from the `push_tokens` collection, using
  `{"path":"/workflow/approvals","type":"workflow.pending"}` as data to check routing.
- **With a device:** follow §4 of [DEVICE-TESTING.md](DEVICE-TESTING.md).
- **Nothing arrives:** check the API log for `PushReceiptsProcessor` errors.
  `InvalidCredentials` or `MismatchSenderId` means the FCM key or APNs key on Expo is wrong
  or missing. A row's `failureReason` in `notifications` shows the ticket error.
