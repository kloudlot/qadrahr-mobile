import AsyncStorage from "@react-native-async-storage/async-storage";

import type { QueuedPunch } from "./punchQueue";

/**
 * Persistence for the punch queue, and nothing else.
 *
 * Split from punchQueue.ts so the reducer stays free of native modules:
 * the decisions in there are the part that can lose someone's pay, and
 * they are worth testing without a device or a mock standing between the
 * test and the logic.
 *
 * Both functions swallow their errors. Unreadable storage is, as far as
 * this app can act on it, an empty queue — and throwing would break the
 * clock screen over something the employee cannot do anything about.
 */

const STORAGE_KEY = "qadrahr.punchQueue.v1";

export async function readQueue(): Promise<QueuedPunch[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedPunch[]) : [];
  } catch {
    return [];
  }
}

export async function writeQueue(queue: QueuedPunch[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // The punch stays in memory for this session and is sent if the app
    // lives long enough.
  }
}
