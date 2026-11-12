# QadraHR — Mobile

The employee app. React Native + Expo, NativeWind for styling.

It covers employee self-service, matching the web console's "Me" area —
clock in and out, leave, pay, expenses, approvals and the rest — with the
frequent things up front and the occasional ones under Me. **It is not a
phone-sized HR console:** administering the company stays on the web.

A standalone project. It talks to `qadrahr-backend` over HTTP and shares no
build with it.

## Running it

```bash
nvm use            # 22.21.1 — Expo 57 needs >= 20.19.4
npm install
npm start
```

Point it at an API with `EXPO_PUBLIC_API_URL`. A simulator can reach
`localhost`; a physical device needs the host machine's LAN address, which is
the most common "works on my machine" in Expo development:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api/v1 npm start
```

Or put that line in `.env` (gitignored), which `expo start` reads. With no
URL set, a dev build uses `http://localhost:3000/api/v1`; a release build
refuses to start.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform ios --output-dir .expo/bundle-check --no-minify
```

The export is worth running before a PR. It catches what typecheck cannot —
a module that resolves in TypeScript but not in Metro — and it is how the
font-bundling problem below was found.

**`.expo/types/router.d.ts` is committed, and that is deliberate.** With
`typedRoutes` on, `tsc` validates every `router.push()` against it — but only
if it exists, and it is produced by the **dev server**, not by `expo config`
or `expo export`. While it was gitignored it was absent in CI and on every
fresh clone, so route validation silently did nothing. Same reasoning as the
backend committing `openapi.json`: a generated artifact is only checkable if
it is checked in.

Run `npm start` after adding or moving a route, and commit the diff.

**API types are generated from the API's contract.** `npm run gen:api` reads
the backend's committed `openapi.json` (from `../qadrahr-backend` by default,
or `SPEC=<path or URL>`) and writes `lib/api/schema.ts`; read it through the
helpers in `lib/api/types.ts` — `Res<"GET /me/attendance">`, `Item<…>`,
`Body<…>`. Regenerate after pulling an API change, and commit the diff: a
renamed or dropped field then fails `npm run typecheck` here instead of
reading as `undefined` on someone's phone. Generating them the first time
found three such bugs — leave history read as empty, maternity leave
previewed in working days, and the notification count named differently
in the API than in its contract.

`npm run lint` currently reports **four warnings and zero errors**, all
pre-dating this app's feature work (`axios` named-export cautions, and one in
`lib/cn.ts`). Zero *errors* is the bar; `--max-warnings=0` is not.

`npm test` covers the two pieces where being wrong is expensive and invisible:

- **`lib/punchQueue.ts`** — the offline clock-in queue, the only code here that
  can lose someone's pay. Written as pure functions over a plain array
  precisely so it can be tested without a device.
- **`lib/geo.ts`** — the geofence port. Its expected values were produced by
  running the *backend's* `src/common/geo/geo.ts`, not by running the port and
  writing down what it said. A self-consistent port would pass while still
  disagreeing with the authority, and the employee would read "340m" while
  their supervisor reviewed a different number.

## What cannot be proved in CI

A green build tells you the code compiles, the queue reducer is correct and
the geofence maths matches the server's. It tells you nothing about permission
dialogs, whether a punch survives a force-quit, or what `accuracyMetres` looks
like on a real phone in a real street.

**[`docs/DEVICE-TESTING.md`](./docs/DEVICE-TESTING.md) is the 30-minute pass**,
step by step, with what each failure means.

It needs one thing this repo does not have: **the icon set** (app, adaptive,
splash, notification). Those are a design deliverable — `app.config.ts` says
where each goes. A `device` build works without them; a production build does
not.

```bash
npm run build:device:ios        # set the https API URL first (see below)
```

### Build profiles

| Script | Profile | For |
| --- | --- | --- |
| `build:dev:ios` / `:android` | `development` | A dev client that attaches to the Metro server. Points at `localhost`, so simulator only. |
| `build:device:ios` / `:android` | `device` | **A standalone build for the device pass.** Needs a reachable **https** API — set `EXPO_PUBLIC_API_URL` in `eas.json` or with `eas env:create`. A phone cannot reach your machine's loopback. |
| `build:preview:ios` / `:android` | `preview` | Internal distribution for someone else to try. |
| `build:prod` | `production` | Store builds, both platforms, auto-incrementing the build number. **Needs the icon set.** |

Every profile except `development` must set `EXPO_PUBLIC_API_URL` to an
`https://` URL: `app.config.ts` fails the EAS build otherwise, so a binary
cannot ship pointing at a laptop.

`npm run build:list` shows recent builds, `eas:whoami` confirms which account
you are signed in as, and `eas:config` prints the resolved config for the
`device` profile — useful when a build picks up the wrong API URL.

## How it is put together

| Concern | Where | Note |
| --- | --- | --- |
| HTTP | `lib/api.ts` | One axios instance. Proactive + single-flight refresh |
| Tokens | `lib/storage.ts` | expo-secure-store — keychain / keystore, not AsyncStorage |
| Session | `lib/session.ts` | Sign in, sign out, `GET /auth/me` |
| Client state | `store/useAuthStore.ts` | Zustand. Who is signed in, and nothing the server owns |
| Server state | TanStack Query | `lib/queryClient.ts`. Never mirrored into Zustand |
| Routing | `app/_layout.tsx` | Expo Router, `Stack.Protected` |
| Theme | `lib/theme/` + `global.css` + `tailwind.config.js` | Tokens as CSS variables; light/dark and the tenant accent applied at runtime by `ThemeProvider` |
| UI kit | `components/ui/` | `Screen`, `HeroHeader`, `Card`, `Sheet`, `ListRow`, `Badge`, pickers, `Toast` |

### Three decisions worth knowing before changing anything

**Colours resolve through CSS variables, not inlined hex.** A tenant's accent
(`GET /tenants/me` → `branding.accentColor`) arrives *after* sign-in, so it
cannot be compiled into a class. `ThemeProvider` derives the whole brand ramp
from that one colour (`lib/theme/color.ts`) and applies it with NativeWind's
`vars()`; it is cached so a cold start paints the tenant's colour at once, and
forgotten on sign-out. With no accent set, the app uses the web console's
orange. Only `--brand-*` is tenant-replaceable; semantic colours are fixed for
every tenant, because support reads screenshots. `global.css` is generated
from `lib/theme/tokens.ts` — `tokens.test.ts` fails if they drift.

**Dark mode follows the phone**, or the user's choice in Me → Appearance.
The system setting only reaches the app in a build with
`userInterfaceStyle: "automatic"` (see `app.config.ts`); the in-app choice
works in any build.

**The refresh is single-flight.** The backend rotates the refresh token on
every use and detects reuse. Four queries mounting at once with an expiring
token would fire four refreshes, three of which present an already-spent
token — which the server correctly treats as theft and kills the session.

**Routing uses `Stack.Protected`, not a redirect in an effect.** The obvious
`useEffect(() => router.replace(...))` produces "Maximum update depth
exceeded" on sign-out: the screen being navigated away from re-renders, the
effect fires again, the navigation restarts.

## What works, and what does not

**Five tabs — Home, Attendance, Leave, Pay, Me** — with tasks and details
pushed over them. Sign-in with the MFA second factor, session restore, push
registration, the clock path with its geofence pre-flight and offline queue,
attendance history and correction requests, leave and requesting it,
payslips (and earlier ones from a legacy payroll system, where the company
has one), expenses with receipt capture, loans and salary advances,
approvals, notifications, my requests (every workflow request in one list),
profile and change requests, documents, assets, announcements, performance,
learning, policies to accept, cases about me (respond and appeal), speaking
up anonymously, my team for managers, two-factor set-up, resignation,
biometric unlock, and light/dark appearance.

Rows on Me for a module the employer's plan doesn't include are hidden
(`lib/queries/modules.ts`, from `GET /me/entitlements`). That only decides
what is offered — it fails open, and the server enforces every call.

Still web-only, on purpose: exporting my data (a JSON file download),
approval delegation, and a manager's promotion or increment
recommendation.

Also in place: the **remembered organisation** on screen 01 (the email and
the employer's name, logo and colour, from `lib/rememberedTenant.ts`, with
"Not you?" to forget them), and **icons and splash**.

Still to do before a store release:

- **Per-operator values in EAS.** Set `EXPO_PUBLIC_API_URL` (https; the
  build refuses anything else outside `development`) and
  `EXPO_PUBLIC_PRODUCT_NAME` (the home-screen name and every in-app mention;
  defaults to "QadraHR", the API's own default) for the `preview` and
  `production` profiles with `eas env:create`.

### Icons and splash

`assets/icon.png`, `adaptive-icon.png`, `splash-icon.png` and
`notification-icon.png` are rendered from the SVGs in `assets/source/` by
`npm run icons` (needs `rsvg-convert`: `brew install librsvg`). They are a
neutral clock mark in the default accent, because the product name is the
operator's. To rebrand, edit the SVGs, or replace the PNGs at the same sizes,
and rebuild — icons are baked into the binary, so they follow the operator's
build, never a tenant's runtime branding. The notification icon must stay a
white silhouette on transparent: Android tints it.

### Known limits worth carrying

- **The face check at clock-in runs in a web view, not in the app.** Where an organisation asks for one (an add-on, see `lib/face.ts`), clock-in opens the capture page from the web app (`components/face/FaceSittingModal.tsx`); the liveness challenges and the photo are taken there and judged by the server. The app needs a connection for that, so a clock-in made offline takes one photo instead (`lib/selfie.ts`), queued with the punch and uploaded at sync: the face is matched, but the punch is flagged, because one photo cannot show the person was there. Not yet run on a physical device: the web view's camera on iOS and Android, and which way a "turn left" reads on a real front camera, both need checking on real phones before release.
- **Device clock skew can strand a queued punch.** A phone whose clock is fast at capture *and* still fast at flush keeps `occurredAt` beyond the server's five-minute future tolerance, and the punch is rejected permanently. Clamping at flush only helps if the user fixed their clock. The real fix is deriving an offset from a response `Date` header at capture. Documented in `lib/punchQueue.ts`.
- **Two client-side ports must track the server.** `lib/geo.ts` and `lib/workingDays.ts` reimplement server arithmetic so a figure can be shown *before* the request is sent — how far to walk, how many days a leave request costs. Both are previews; the server recomputes and is the only authority. Their tests assert values produced by running the backend's own modules, so if either server module changes, those tests should be regenerated rather than adjusted to match the port. Writing the second one caught a real bug: the server uses `0 = Sunday` and the port had used ISO `7 = Sunday`, which is wrong by a day at any company working Saturdays.

## Gotchas already paid for

**Import fonts from their subpaths.** `@expo-google-fonts/inter` re-exports
all eighteen weights and the bundler follows that — importing four from the
package root shipped all eighteen. Measured: 12M bundle → 7.3M.

**`react-dom` is pinned by an `overrides` entry, and removing it breaks
`npm install`.** `expo` lists `react-dom` as an optional peer; npm resolves it
to a version newer than the `react` this SDK pins, and the install fails with
ERESOLVE before any package is written. This app never imports `react-dom` —
the override aligns it with `react` rather than adding a dependency. If you
bump `react`, bump the override with it.

**TanStack Query has no online detection on React Native.** `onlineManager`
listens for a browser `online` event that does not exist here, so without
`lib/connectivity.ts` wiring NetInfo into it, every request is attempted as
though the connection were fine and the app discovers otherwise only by
letting one time out. That is why `@react-native-community/netinfo` is a
dependency, and why it is started at module load in `app/_layout.tsx` rather
than in a component.
