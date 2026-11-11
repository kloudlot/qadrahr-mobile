jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("./api", () => ({ http: { patch: jest.fn(async () => ({})) } }));

import { router } from "expo-router";
import { http } from "./api";
import { openNotification, pushDestination } from "./openNotification";

describe("opening a push", () => {
  it("opens an announcement, and knows which row to mark read", () => {
    const destination = pushDestination({
      type: "broadcast.published",
      notificationId: "n1",
      broadcastId: "b1",
      path: "/me/announcements?broadcast=b1",
    });
    expect(destination.notificationId).toBe("n1");
    expect(destination.href).not.toBe("/notifications");
  });

  it("opens the list for something the app has no screen for, so a tap never does nothing", () => {
    expect(pushDestination({ type: "some.web.only.thing" }).href).toBe("/notifications");
    expect(pushDestination(undefined)).toEqual({ href: "/notifications", notificationId: null });
  });

  it("marks the row read and navigates — the same for a tray tap and a toast tap", async () => {
    const queryClient = { invalidateQueries: jest.fn() };
    openNotification({ type: "broadcast.published", notificationId: "n1", broadcastId: "b1" }, queryClient as never);
    expect(http.patch).toHaveBeenCalledWith("/me/notifications/n1/read");
    expect(router.push).toHaveBeenCalledTimes(1);
  });
});
