import {
  draftFrom,
  parseProgress,
  percent,
  phaseLabel,
  preferredCycle,
  preferredTeamCycle,
  ratedCount,
  reviewBody,
  weightTotal,
} from "./performance";

describe("performance", () => {
  it("opens on the cycle that needs the person, not just the newest", () => {
    const cycles = [
      { _id: "new", phase: "closed", owed: 0 },
      { _id: "live", phase: "in_progress", owed: 0 },
      { _id: "due", phase: "self_review", owed: 1 },
    ];
    expect(preferredCycle(cycles)?._id).toBe("due");
    expect(preferredCycle(cycles.slice(0, 2))?._id).toBe("live");
    expect(preferredCycle(cycles.slice(0, 1))?._id).toBe("new");
    expect(preferredCycle([])).toBeUndefined();
    expect(
      preferredTeamCycle([{ phase: "closed" }, { phase: "manager_review" }]),
    ).toEqual({ phase: "manager_review" });
  });

  it("sends only what was rated, and leaves blanks out", () => {
    const draft = draftFrom({
      goalRatings: [{ goalId: "g1", rating: 4, comment: "  " }],
      competencyRatings: [],
      strengths: " Clear writing ",
    });
    draft.goals.g2 = { comment: "not rated yet" };
    draft.competencies.Teamwork = { rating: 3, comment: "Helps others" };

    expect(reviewBody(draft, true)).toEqual({
      goalRatings: [{ goalId: "g1", rating: 4, comment: undefined }],
      competencyRatings: [
        { competency: "Teamwork", rating: 3, comment: "Helps others" },
      ],
      strengths: "Clear writing",
      developmentAreas: undefined,
      overallComment: undefined,
      submit: true,
    });
    expect(ratedCount(draft, ["g1", "g2"], ["Teamwork"])).toEqual({
      rated: 2,
      total: 3,
    });
  });

  it("reads weights, totals and progress the way the API means them", () => {
    expect(percent(0.5)).toBe("50%");
    expect(percent(1 / 3)).toBe("33.3%");
    expect(percent(null)).toBe("—");
    expect(
      weightTotal([
        { weight: 0.6, status: "active" },
        { weight: 0.4, status: "draft" },
        { weight: 0.5, status: "cancelled" },
      ]),
    ).toBe(100);
    expect(parseProgress("47.6")).toBe(48);
    expect(parseProgress("140")).toBe(100);
    expect(parseProgress("")).toBeNull();
    expect(parseProgress("abc")).toBeNull();
  });

  it("names phases", () => {
    expect(phaseLabel("manager_review")).toBe("Manager review");
    expect(phaseLabel("something_new")).toBe("something new");
  });
});
