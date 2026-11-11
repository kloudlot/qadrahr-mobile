import { entitledDays } from "./leaveBalance";

describe("entitledDays", () => {
  it("counts what HR adjusted, as the web does", () => {
    expect(entitledDays({ accrued: 20, carriedOver: 3, adjustments: 2 })).toBe(
      25,
    );
    expect(entitledDays({ accrued: 20, carriedOver: 0, adjustments: -5 })).toBe(
      15,
    );
  });

  it("treats a missing adjustment as none", () => {
    expect(entitledDays({ accrued: 10, carriedOver: 0 })).toBe(10);
  });
});
