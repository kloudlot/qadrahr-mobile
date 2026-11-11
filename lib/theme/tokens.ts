/**
 * The non-brand tokens, per scheme, as hex.
 *
 * `global.css` holds the same values as CSS variables, which is what every
 * `className` reads. This copy exists for the places a className cannot
 * reach — lucide icon colours, the tab bar, the status bar, spinners, the
 * pull-to-refresh tint. `tokens.test.ts` fails if the two drift.
 *
 * The brand is not here: it comes from `brandRamp()` at runtime, because a
 * tenant can replace it. Semantic colours ARE here and are never replaced —
 * success is the same green in every tenant, including one whose brand is
 * green, because support reads screenshots.
 */

import type { Scheme } from "./color";

/** The web console's accent. Used when the tenant has not set one. */
export const DEFAULT_ACCENT = "#168AAD";

export interface Tokens {
  surface: [string, string, string, string, string, string, string, string, string, string];
  success: string;
  successSubtle: string;
  successInk: string;
  warning: string;
  warningSubtle: string;
  warningInk: string;
  danger: string;
  dangerSubtle: string;
  dangerInk: string;
  info: string;
  infoSubtle: string;
  infoInk: string;
  neutral: string;
  neutralSubtle: string;
  neutralInk: string;
}

/**
 * surface[0] is the page, [1] the card, [2] an inset, [3]/[4] borders,
 * [5] disabled, [6] secondary text, [7] body text, [8] labels, [9] primary
 * text. Dark mode keeps the ROLES and inverts the values, so a screen that
 * says `text-text-secondary` is right in both.
 */
export const TOKENS: Record<Scheme, Tokens> = {
  light: {
    // The web console's "ink" ramp.
    surface: ["#F6F7F9", "#FFFFFF", "#ECEEF2", "#E2E5EB", "#D5D9E2", "#8792A9", "#535D75", "#444C5F", "#3B4151", "#1C2030"],
    success: "#059669",
    successSubtle: "#ECFDF5",
    successInk: "#065F46",
    warning: "#D97706",
    warningSubtle: "#FFFBEB",
    warningInk: "#92400E",
    danger: "#DC2626",
    dangerSubtle: "#FEF2F2",
    dangerInk: "#991B1B",
    info: "#0891B2",
    infoSubtle: "#ECFEFF",
    infoInk: "#155E75",
    neutral: "#68748E",
    neutralSubtle: "#ECEEF2",
    neutralInk: "#444C5F",
  },
  dark: {
    surface: ["#0E1017", "#171A24", "#1F2330", "#2A2F3D", "#3A4152", "#5D667C", "#9AA3B8", "#C9CFDB", "#DDE1EA", "#F3F4F7"],
    success: "#10B981",
    successSubtle: "#0D2A22",
    successInk: "#6EE7B7",
    warning: "#F59E0B",
    warningSubtle: "#2E2210",
    warningInk: "#FCD34D",
    danger: "#EF4444",
    dangerSubtle: "#2F1416",
    dangerInk: "#FCA5A5",
    info: "#06B6D4",
    infoSubtle: "#0C2630",
    infoInk: "#67E8F9",
    neutral: "#8792A9",
    neutralSubtle: "#1F2330",
    neutralInk: "#C9CFDB",
  },
};
