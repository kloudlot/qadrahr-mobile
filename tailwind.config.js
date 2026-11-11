const { hairlineWidth } = require("nativewind/theme");

/**
 * QadraHR — NativeWind theme.
 *
 * Colours resolve through the CSS variables in global.css rather than being
 * inlined from the token file, so a tenant's `--brand-*` can be swapped at
 * runtime. See the comment at the top of global.css for why that matters.
 *
 * Everything else — the type scale, spacing, radii — is the token file's
 * values, with the MOBILE ergonomics applied: body steps up from 14px to
 * 16px, and controls are 44px rather than 36px. Those two deltas are the
 * whole difference between this and the web theme.
 */

const rgb = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Dark mode is driven by ThemeProvider (the user's choice, or the
  // system's) through NativeWind's colour scheme — see lib/theme.
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: rgb("brand-primary"),
          hover: rgb("brand-primary-hover"),
          active: rgb("brand-primary-active"),
          subtle: rgb("brand-primary-subtle"),
          border: rgb("brand-primary-border"),
          ink: rgb("brand-on-primary"),
        },

        success: {
          DEFAULT: rgb("success"),
          subtle: rgb("success-subtle"),
          ink: rgb("success-ink"),
        },
        warning: {
          DEFAULT: rgb("warning"),
          subtle: rgb("warning-subtle"),
          ink: rgb("warning-ink"),
        },
        danger: {
          DEFAULT: rgb("danger"),
          subtle: rgb("danger-subtle"),
          ink: rgb("danger-ink"),
        },
        info: {
          DEFAULT: rgb("info"),
          subtle: rgb("info-subtle"),
          ink: rgb("info-ink"),
        },
        neutral: {
          DEFAULT: rgb("neutral"),
          subtle: rgb("neutral-subtle"),
          ink: rgb("neutral-ink"),
        },

        surface: {
          0: rgb("surface-0"),
          1: rgb("surface-1"),
          2: rgb("surface-2"),
          3: rgb("surface-3"),
          4: rgb("surface-4"),
          5: rgb("surface-5"),
          6: rgb("surface-6"),
          7: rgb("surface-7"),
          8: rgb("surface-8"),
          9: rgb("surface-9"),
        },

        text: {
          primary: rgb("text-primary"),
          body: rgb("text-body"),
          secondary: rgb("text-secondary"),
          label: rgb("text-label"),
          "on-dark": rgb("text-on-dark"),
          disabled: rgb("text-disabled"),
        },

        border: {
          DEFAULT: rgb("border-default"),
          strong: rgb("border-strong"),
        },

        bg: {
          page: rgb("bg-page"),
          card: rgb("bg-card"),
          inset: rgb("bg-inset"),
        },
      },

      fontFamily: {
        // React Native resolves weights by family name, not fontWeight.
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
      },

      fontSize: {
        display: ["30px", { lineHeight: "36px" }],
        h1: ["24px", { lineHeight: "32px" }],
        h2: ["20px", { lineHeight: "28px" }],
        h3: ["16px", { lineHeight: "24px" }],
        // 16px, not the web's 14px. Mobile body steps up — the app is read
        // one-handed, outdoors, often on a cracked screen.
        body: ["16px", { lineHeight: "24px" }],
        small: ["14px", { lineHeight: "20px" }],
        caption: ["13px", { lineHeight: "18px" }],
        micro: ["11px", { lineHeight: "14px", letterSpacing: "0.08em" }],
      },

      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
        // Named mobile ergonomics from tokens.native, so a screen can say
        // what it means rather than repeating a number.
        touch: "44px",
        "screen-x": "16px",
        tabbar: "56px",
        "safe-bottom": "16px",
      },

      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        pill: "9999px",
      },

      borderWidth: {
        hairline: hairlineWidth(),
      },

      letterSpacing: {
        tight: "-0.02em",
        snug: "-0.01em",
        normal: "0em",
        wide: "0.08em",
      },
    },
  },
  plugins: [],
};
