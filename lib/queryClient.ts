import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,

      /**
       * A 4xx is an answer, not a failure.
       *
       * "You are outside the geofence", "this leave request was already
       * approved", "you do not have permission" — retrying any of those
       * three times produces the same answer three times more slowly, and
       * the employee watches a spinner instead of reading what happened.
       * Only retry what might genuinely differ next time: network errors
       * and 5xx.
       */
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      // Never. A retried clock-in is a second clock-in, and a retried leave
      // request is two days off.
      retry: false,
    },
  },
});
