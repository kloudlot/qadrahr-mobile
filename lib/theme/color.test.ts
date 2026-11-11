import {
  brandRamp,
  brandVariables,
  contrast,
  DARK_SURFACE,
  INK,
  mix,
  onColor,
  parseHex,
  toChannels,
  toHex,
} from "./color";

const WHITE = { r: 255, g: 255, b: 255 };

describe("parseHex", () => {
  it("reads six- and three-digit hex, with or without the hash", () => {
    expect(parseHex("#EA580C")).toEqual({ r: 234, g: 88, b: 12 });
    expect(parseHex("ea580c")).toEqual({ r: 234, g: 88, b: 12 });
    expect(parseHex("#fff")).toEqual(WHITE);
  });

  it("refuses anything that is not plainly a colour, rather than guessing", () => {
    for (const bad of [null, undefined, "", "red", "#12345", "#1234567", "rgb(1,2,3)", "#gggggg"]) {
      expect(parseHex(bad)).toBeNull();
    }
  });
});

describe("formatting", () => {
  it("round-trips hex and writes channels for the CSS variables", () => {
    expect(toHex({ r: 234, g: 88, b: 12 })).toBe("#ea580c");
    expect(toChannels({ r: 234, g: 88, b: 12 })).toBe("234 88 12");
  });

  it("mixes linearly", () => {
    expect(mix({ r: 0, g: 0, b: 0 }, WHITE, 0.5)).toEqual({ r: 128, g: 128, b: 128 });
    expect(mix({ r: 10, g: 20, b: 30 }, WHITE, 0)).toEqual({ r: 10, g: 20, b: 30 });
  });
});

describe("contrast", () => {
  it("matches the WCAG extremes", () => {
    expect(contrast(WHITE, { r: 0, g: 0, b: 0 })).toBeCloseTo(21, 0);
    expect(contrast(WHITE, WHITE)).toBeCloseTo(1, 5);
  });

  it("puts white on the console orange, and ink on a pale accent nobody could read white on", () => {
    expect(onColor(parseHex("#EA580C")!)).toEqual(WHITE);
    expect(onColor(parseHex("#FACC15")!)).toEqual(INK);
    expect(onColor(parseHex("#A5F3FC")!)).toEqual(INK);
  });
});

describe("brandRamp", () => {
  const accents = ["#EA580C", "#4F46E5", "#0F766E", "#111827", "#FDE047", "#DB2777"];

  it("always yields a label that reads on the accent (3:1, the UI-component floor)", () => {
    for (const hex of accents) {
      for (const scheme of ["light", "dark"] as const) {
        const ramp = brandRamp(parseHex(hex)!, scheme);
        expect(contrast(ramp.onPrimary, ramp.primary)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps the tenant's exact colour in light mode", () => {
    expect(brandRamp(parseHex("#4F46E5")!, "light").primary).toEqual(parseHex("#4F46E5"));
  });

  it("lifts an accent too dark to see on the dark surface", () => {
    const navy = parseHex("#111827")!;
    expect(contrast(navy, DARK_SURFACE)).toBeLessThan(3);
    expect(contrast(brandRamp(navy, "dark").primary, DARK_SURFACE)).toBeGreaterThanOrEqual(3);
  });

  it("derives a pressed state darker than the accent, and a subtle tint close to the background", () => {
    const light = brandRamp(parseHex("#EA580C")!, "light");
    expect(contrast(light.active, WHITE)).toBeGreaterThan(contrast(light.primary, WHITE));
    expect(contrast(light.subtle, WHITE)).toBeLessThan(1.2);

    const dark = brandRamp(parseHex("#EA580C")!, "dark");
    expect(contrast(dark.subtle, DARK_SURFACE)).toBeLessThan(1.6);
  });

  it("names every variable the Tailwind theme reads", () => {
    expect(Object.keys(brandVariables(brandRamp(parseHex("#EA580C")!, "light"))).sort()).toEqual([
      "--brand-on-primary",
      "--brand-primary",
      "--brand-primary-active",
      "--brand-primary-border",
      "--brand-primary-hover",
      "--brand-primary-subtle",
    ]);
  });
});
