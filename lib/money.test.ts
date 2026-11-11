import { amountPlaceholder, decimalsFor, toMajor, toMinor } from "./money";
import { formatMoney } from "./queries/company";
import { parseAmount } from "./queries/expenses";

jest.mock("./api", () => ({ http: { get: jest.fn() } }));

describe("money by currency", () => {
  it("knows each currency's decimal places, as the API stores them", () => {
    expect(decimalsFor("NGN")).toBe(2);
    expect(decimalsFor("jpy")).toBe(0);
    expect(decimalsFor("KWD")).toBe(3);
    expect(decimalsFor(undefined)).toBe(2);
  });

  it("converts both ways without drift", () => {
    expect(toMinor(19.99, "GHS")).toBe(1999);
    expect(toMajor(1999, "GHS")).toBe(19.99);
    expect(toMinor(1500, "JPY")).toBe(1500);
    expect(toMinor(1.234, "KWD")).toBe(1234);
  });

  it("formats a payslip in a zero- or three-decimal currency correctly", () => {
    // 150,000 yen arrives as 150000 minor units — not ¥1,500.00.
    expect(formatMoney(150000, "JPY")).toContain("150,000");
    expect(formatMoney(150000, "JPY")).not.toContain(".");
    expect(formatMoney(1234, "KWD")).toContain("1.234");
    expect(formatMoney(25_000_000, "NGN")).toContain("250,000.00");
  });

  it("shows no symbol, rather than a wrong one, when the currency isn't known yet", () => {
    expect(formatMoney(25_000_000, undefined)).toBe("250,000.00");
  });

  it("parses what someone typed in the claim's currency", () => {
    expect(parseAmount("1500", "JPY")).toBe(1500);
    expect(parseAmount("12,5", "GHS")).toBe(1250); // a comma is a decimal point on many keypads
    expect(parseAmount("12.50", "GHS")).toBe(1250);
    expect(parseAmount("", "NGN")).toBeNull();
    expect(amountPlaceholder("KWD")).toBe("0.000");
    expect(amountPlaceholder("JPY")).toBe("0");
  });
});
