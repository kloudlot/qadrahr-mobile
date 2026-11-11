import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/lib/cn";

type Variant = "display" | "h1" | "h2" | "h3" | "body" | "small" | "caption" | "micro";

/**
 * Text, with the type scale applied by name.
 *
 * Weight comes from the font FAMILY, not `fontWeight`: React Native resolves
 * weights by family name, so `font-semibold` here maps to Inter_600SemiBold
 * rather than asking the system to synthesise a bold.
 */
const VARIANTS: Record<Variant, string> = {
  display: "text-display font-bold tracking-tight",
  h1: "text-h1 font-semibold tracking-snug",
  h2: "text-h2 font-semibold",
  h3: "text-h3 font-semibold",
  body: "text-body font-sans",
  small: "text-small font-sans",
  caption: "text-caption font-sans",
  micro: "text-micro font-medium tracking-wide uppercase",
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  /**
   * Tabular figures. MANDATORY for money, hours and counts.
   *
   * Proportional digits make a column of amounts ragged, and two payslip
   * figures that should line up visibly do not. This is a house rule from
   * the design system, not a preference.
   */
  tabular?: boolean;
  className?: string;
}

export function Text({
  variant = "body",
  tabular = false,
  className,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn(VARIANTS[variant], "text-text-body", className)}
      style={[tabular ? { fontVariant: ["tabular-nums"] } : null, style]}
      {...props}
    />
  );
}
