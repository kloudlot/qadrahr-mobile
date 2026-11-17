import { moduleForPath } from "./moduleRoutes";

describe("moduleForPath", () => {
  it("maps a screen and its children to the module", () => {
    expect(moduleForPath("/expenses")).toBe("expenses");
    expect(moduleForPath("/leave/request")).toBe("leave");
    expect(moduleForPath("/pay/665f1c2e8a1b2c3d4e5f6081")).toBe("payroll");
    expect(moduleForPath("/loans")).toBe("payroll");
    expect(moduleForPath("/speak-up")).toBe("employee_relations");
    expect(moduleForPath("/face")).toBe("face_attendance");
  });

  it("leaves screens every employer has unmapped", () => {
    expect(moduleForPath("/")).toBeNull();
    expect(moduleForPath("/profile/edit")).toBeNull();
    expect(moduleForPath("/requests")).toBeNull();
  });

  it("matches whole segments only", () => {
    expect(moduleForPath("/payslip-help")).toBeNull();
    expect(moduleForPath("/leaves")).toBeNull();
  });
});
