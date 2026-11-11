/**
 * Colour arithmetic for the tenant accent.
 *
 * A tenant sets ONE colour. Everything the app needs from it — pressed and
 * hover states, a tinted background, a border, and the text that sits on
 * it — is derived here, the same way the web console derives its states.
 * Deriving rather than accepting a palette means a tenant cannot ship a
 * pressed state that vanishes, or a label nobody can read.
 *
 * Pure functions, no React: the theme provider and the tests both call them.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export type Scheme = "light" | "dark";

export interface BrandRamp {
  primary: Rgb;
  hover: Rgb;
  active: Rgb;
  subtle: Rgb;
  border: Rgb;
  onPrimary: Rgb;
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };
/** ink-900, the dark text the app uses everywhere. */
export const INK: Rgb = { r: 28, g: 32, b: 48 };
/** The dark-mode card surface, which dark tints are mixed toward. */
export const DARK_SURFACE: Rgb = { r: 23, g: 26, b: 36 };

/** `#rgb` or `#rrggbb`, with or without the hash. Anything else is null, never a guess. */
export function parseHex(input: string | null | undefined): Rgb | null {
  if (!input) return null;
  const hex = input.trim().replace(/^#/, "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** "234 88 12" — the form the CSS variables hold, so Tailwind opacity modifiers work. */
export function toChannels({ r, g, b }: Rgb): string {
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

/** `a` moved `amount` (0–1) of the way toward `b`. */
export function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount),
  };
}

/** WCAG relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1–21. */
export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * The label colour for text on the accent.
 *
 * White when it reaches 3:1 — the WCAG floor for UI components and bold
 * labels, which is what sits on a brand fill here — because a white label
 * is what the product looks like (the default QadraHR teal is ~4:1). Below
 * that, the accent is too light for white and the label goes dark.
 */
export function onColor(background: Rgb): Rgb {
  return contrast(WHITE, background) >= 3 ? WHITE : INK;
}

/**
 * The full brand ramp for one accent in one scheme.
 *
 * In dark mode a too-dark accent is lifted until it reads against the dark
 * surface (3:1), so a navy tenant does not disappear; tints are mixed
 * toward the dark surface rather than white.
 */
export function brandRamp(accent: Rgb, scheme: Scheme): BrandRamp {
  if (scheme === "light") {
    return {
      primary: accent,
      hover: mix(accent, BLACK, 0.1),
      active: mix(accent, BLACK, 0.2),
      subtle: mix(accent, WHITE, 0.9),
      border: mix(accent, WHITE, 0.7),
      onPrimary: onColor(accent),
    };
  }

  let primary = accent;
  for (let step = 0; step < 10 && contrast(primary, DARK_SURFACE) < 3; step += 1) {
    primary = mix(primary, WHITE, 0.12);
  }
  return {
    primary,
    hover: mix(primary, WHITE, 0.1),
    active: mix(primary, BLACK, 0.15),
    subtle: mix(primary, DARK_SURFACE, 0.82),
    border: mix(primary, DARK_SURFACE, 0.55),
    onPrimary: onColor(primary),
  };
}

/** The ramp as the CSS variables the Tailwind theme reads. */
export function brandVariables(ramp: BrandRamp): Record<string, string> {
  return {
    "--brand-primary": toChannels(ramp.primary),
    "--brand-primary-hover": toChannels(ramp.hover),
    "--brand-primary-active": toChannels(ramp.active),
    "--brand-primary-subtle": toChannels(ramp.subtle),
    "--brand-primary-border": toChannels(ramp.border),
    "--brand-on-primary": toChannels(ramp.onPrimary),
  };
}
