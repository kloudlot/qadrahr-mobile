import { brandRamp, brandVariables, contrast, parseHex, toChannels, type Scheme } from "./color";
import { DEFAULT_ACCENT, TOKENS } from "./tokens";

/**
 * global.css and tokens.ts hold the same values — one for classNames, one
 * for raw colours (icons, tab bar, status bar). This fails the moment they
 * drift, which is otherwise a bug nobody notices until an icon is the wrong
 * shade in dark mode.
 */
// Through jest rather than imports: the app's tsconfig has no Node types,
// and this is the only file that needs them.
const fs = jest.requireActual<{ readFileSync: (path: string, encoding: "utf8") => string }>("fs");
const css = fs.readFileSync(`${jest.requireActual<{ cwd: () => string }>("process").cwd()}/global.css`, "utf8");

function block(scheme: Scheme): Record<string, string> {
  const selector = scheme === "light" ? ":root {" : ".dark:root {";
  const start = css.indexOf(selector);
  const body = css.slice(start + selector.length, css.indexOf("\n  }", start));
  const vars: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    if (name && value) vars[name] = value.trim();
  }
  return vars;
}

const SEMANTIC: [string, keyof (typeof TOKENS)["light"]][] = [
  ["--success", "success"],
  ["--success-subtle", "successSubtle"],
  ["--success-ink", "successInk"],
  ["--warning", "warning"],
  ["--warning-subtle", "warningSubtle"],
  ["--warning-ink", "warningInk"],
  ["--danger", "danger"],
  ["--danger-subtle", "dangerSubtle"],
  ["--danger-ink", "dangerInk"],
  ["--info", "info"],
  ["--info-subtle", "infoSubtle"],
  ["--info-ink", "infoInk"],
  ["--neutral", "neutral"],
  ["--neutral-subtle", "neutralSubtle"],
  ["--neutral-ink", "neutralInk"],
];

describe.each(["light", "dark"] as const)("global.css (%s)", (scheme) => {
  const vars = block(scheme);
  const tokens = TOKENS[scheme];
  const channels = (hex: string) => toChannels(parseHex(hex)!);

  it("matches the surface ramp", () => {
    tokens.surface.forEach((hex, i) => expect(vars[`--surface-${i}`]).toBe(channels(hex)));
  });

  it("matches the semantic colours", () => {
    for (const [name, key] of SEMANTIC) expect(vars[name]).toBe(channels(tokens[key] as string));
  });

  it("defaults the brand to the console's accent", () => {
    const expected = brandVariables(brandRamp(parseHex(DEFAULT_ACCENT)!, scheme));
    for (const [name, value] of Object.entries(expected)) expect(vars[name]).toBe(value);
  });

  it("declares every alias a screen references", () => {
    for (const alias of ["--text-primary", "--text-body", "--text-secondary", "--text-label", "--text-disabled", "--border-default", "--border-strong", "--bg-page", "--bg-card", "--bg-inset"]) {
      expect(vars[alias]).toBeDefined();
    }
  });

  it("keeps secondary text readable on the page and the card (4.5:1)", () => {
    const secondary = parseHex(tokens.surface[6])!;
    expect(contrast(secondary, parseHex(tokens.surface[0])!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(secondary, parseHex(tokens.surface[1])!)).toBeGreaterThanOrEqual(4.5);
  });
});
