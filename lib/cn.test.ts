import { cn } from "./cn";

describe("cn", () => {
  it("keeps a text size when a text colour follows it", () => {
    expect(cn("text-body font-sans", "text-text-body", "text-text-secondary")).toBe(
      "text-body font-sans text-text-secondary",
    );
  });

  it("lets a later size or family replace an earlier one", () => {
    expect(cn("text-h1 font-semibold", "text-small")).toBe("font-semibold text-small");
    expect(cn("text-body font-sans", "font-semibold")).toBe("text-body font-semibold");
  });
});
