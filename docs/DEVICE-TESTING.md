# Device testing

Everything in this document is something **CI cannot prove**, by construction.
A green build tells you the code compiles, the queue reducer is correct, and
the geofence maths matches the server's. It tells you nothing about whether a
permission dialog appears, whether a punch survives a force-quit, or whether
`accuracyMetres` on a real phone in a real street resembles the synthetic
figure a simulator reports.

Allow about 30 minutes. Most of it is waiting for signal to come back.

## Before you start

**You need three things this repo does not have:**

1. **An app icon, adaptive icon, splash image and notification icon.** These
   are a design deliverable. `app.config.ts` has a comment saying where each
   goes; until they exist a production build either fails at `prebuild` or
   ships with placeholders. A `device` build works without them.
2. **A reachable API.** Not `localhost` — a phone cannot reach your machine's
   loopback. Either a deployed backend or your machine's LAN address. Set it
   in `eas.json` under the `device` profile, replacing `REPLACE-ME`.
3. **A seeded tenant with an employee who can clock in.** `npm run seed` in
   the backend creates one; the system `Employee` role carries
   `attendance:clock`. The employee record must be linked to the user account
   and must have a branch, or `/me/attendance/work-location` returns nulls and
   the geofence checks below cannot be exercised.

```bash
npx eas build --profile device --platform ios     # or android
```

## 1. Location permission — the three refusals

The app distinguishes **services off**, **permission denied** and **no fix**,
because each sends the employee somewhere different. A build that collapses
them is the most likely regression here.

| Setup | Expected |
| --- | --- |
| Device Location switched off entirely | Sheet: *"Turn on Location to confirm where you are"*, action opens Settings |
| Location on, app permission denied | Sheet: *"Allow QadraHR to use your location"*, action opens Settings |
| Permission granted, indoors with no fix for 10s | Pill reads *"No location yet"*; the Clock in button still works |

**The last row is the important one.** If the button is disabled or the app
appears stuck, the timeout is not working and an employee in a basement
car park cannot start their shift.

In all three cases **Clock in must still be offered.** The server records a
punch without coordinates and flags it; a client that refuses is stricter than
the system it is a client of, and leaves someone unpaid over a permission
dialog.

## 2. Geofence — and the number that must match

Stand at the branch whose geofence is configured, then walk away from it.

- **Inside the fence:** pill reads *"‹Branch› · confirmed Ns ago"*. Clock in
  goes straight through with no sheet.
- **Outside it:** sheet reads *"You're about ‹N›m from ‹Branch›"*, offering
  **Clock in anyway**.

**Then check the number.** Take the out-of-fence punch, and have someone with
`attendance:read` open the same punch in the supervisor view. The
`distanceMetres` the server recorded should match what the sheet said, within
rounding.

They are computed by two implementations — `lib/geo.ts` and the backend's
`common/geo/geo.ts`. The unit tests assert they agree on fixed inputs; this
confirms they agree on a real fix, with real `accuracyMetres` widening the
fence. **A simulator reports a fixed synthetic accuracy and never exercises
that widening**, which is why this step needs a real phone outdoors.

## 3. The offline queue — the part that can lose someone's pay

This is the sequence worth doing twice.

1. **Airplane mode on.**
2. **Clock in.** Expect the sheet: *"Saved — it'll sync when you're back
   online"*, and the card flips to clocked-in with the pill reading
   *"Waiting to sync"*.
3. **Force-quit the app.** Swipe it away entirely; do not just background it.
4. **Relaunch.** The card must **still** show clocked-in and *"Waiting to
   sync"*. If it shows "Not clocked in today", the queue did not survive
   restart and the punch is gone.
5. **Airplane mode off.** Within a few seconds the pill should change to the
   normal location line and the elapsed timer should continue from the
   original clock-in time — **not** restart from zero.
6. **Confirm server-side.** The punch's `occurredAt` should be when you
   pressed the button in step 2, not when signal returned.

Step 6 is the whole point. A punch that lands with the sync time rather than
the capture time costs the employee the hours in between.

### Then the direction case

With a punch still queued, **clock out while still offline**, then restore
signal. Both punches must arrive, **in order**, and the second must be an
`out`. If it arrives as a second `in`, the pinned direction is not being sent
and the server inferred it — which is the failure `lib/punchQueue.ts` exists
to prevent.

### And the shared-device case

Queue a punch offline, then **sign out without restoring signal**. Sign in as
a different employee and restore signal.

**Nothing should be sent.** The queue is keyed by user and cleared on
sign-out, precisely so one employee's punch is never delivered under another's
token. If a punch appears against the second employee, that is a buddy-punch
the app created by itself.

## 4. Push

Only meaningful on a physical device — `Device.isDevice` is false on a
simulator and `lib/push.ts` correctly returns `null` there. The build needs
push credentials first: see [PUSH.md](PUSH.md).

1. Sign in. Accept the notification permission.
2. Confirm a token was registered: the backend's `push_tokens` collection for
   that tenant should have **one** row for the user, with an
   `ExponentPushToken[...]` value.
3. **Arrives and opens.** As another user, submit a leave request this user
   approves. A push arrives within seconds; tapping it opens Approvals and the
   row in Notifications is no longer bold. With the app in the background or
   the phone locked, it pops up as a heads-up banner with sound. With the app
   open, an in-app toast appears instead (no system banner as well); tapping
   it opens the same place, and the bell count goes up without a pull.
   - **Broadcast.** Send an announcement from the web console as another user.
     It pops up the same way. If it only lands silently in the tray, check
     Android Settings → Apps → the app → Notifications: "Announcements" and
     "Updates" must be listed. An old "Updates" channel at default importance
     means the build predates the channel fix.
   - **Back from the background.** Leave the app in the background, send an
     announcement, then dismiss the system notification without tapping it.
     When you return to the app, the bell shows the new count without a pull.
4. **Lock screen.** Publish a payslip for this user. The push says the payslip
   is ready and when it is paid — **never the net pay**. Tapping opens that
   payslip.
5. **Badge.** The app icon shows the unread count; "Read all" clears it.
6. **Muting.** Me → Settings → Notifications → switch off *Payslips*. Publish
   again: no push, but the row still appears in Notifications.
7. **Refused permission.** Refuse the prompt on a fresh install. Notification
   settings shows "Notifications are off on this phone" with *Open settings*;
   turning them on there and coming back hides the card.
8. **Sign out.** The row must be **gone**. If it survives, the next person to
   hold this phone receives the previous employee's payslip alerts — which is
   the failure the awaited unregister in `lib/session.ts` exists to prevent.
9. **Signed in elsewhere.** Sign in again, then sign the same account in on the
   web. The phone shows "used on another device", the `push_tokens` row is
   gone, and no further pushes arrive.

## 5. Biometric unlock

1. **Me → Settings → Face ID / Touch ID → on.** A prompt should appear immediately; the
   setting must **not** switch on if you cancel it.
2. Background the app for **over a minute**, then return. Expect the Locked
   screen.
3. Background it for **under a minute**, then return. Expect **no** lock —
   a check on every task-switch fires when someone glances at a text mid
   clock-in.
4. **Remove your enrolled face/fingerprint in device settings**, then relaunch
   the app. You must still get in. The gate fails **open** on purpose:
   someone locked out of an app they are already signed into, by a check that
   malfunctioned, has no way forward but reinstalling.

## 6. Receipt capture

1. Expenses → open a claim → **Take photo**. Accept the camera permission.
2. Add the line. Watch for *"Uploading receipt…"* on the button.
3. The stored line should show **"Receipt attached"**.
4. Have someone with `expense:read` open the claim and fetch the receipt
   through `GET /expenses/:id/lines/:lineId/receipt`. The image must load.

If step 4 fails but step 3 succeeded, the key was attached without the object
arriving — the case `uploadReceipt` throws to prevent, and worth reporting
with the exact sequence.

## What to write down

For anything that fails, capture: **the step number**, what the screen said
verbatim, and — for anything involving a punch — the `businessDate` and the
employee number, so the punch can be found server-side. The screen's copy
matters: every message in the failure sheets is meant to say *what to do*, and
one that says what went wrong instead is a bug even if the behaviour is right.
