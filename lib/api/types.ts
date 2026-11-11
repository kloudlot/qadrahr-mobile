/**
 * Typed access to the generated `Operations` map. Keys are `METHOD /path`
 * exactly as the API declares them, e.g. `Res<"GET /me/attendance">`.
 *
 * Generated from the API's committed openapi.json (npm run gen:api), so a
 * field the API renames or drops fails here at compile time instead of on
 * someone's phone.
 */
import type { Operations } from "./schema";

export type OpKey = keyof Operations;

/** Request body of an operation. */
export type Body<K extends OpKey> = Operations[K]["body"];

/** Successful response of an operation. */
export type Res<K extends OpKey> = Operations[K]["response"];

/** Query parameters of an operation. */
export type Query<K extends OpKey> = Operations[K]["query"];

/** Path parameters of an operation. */
export type PathParams<K extends OpKey> = Operations[K]["path"];

/** Row type of a list operation: the element of `{ data: T[] }` or of a bare `T[]`. */
export type Item<K extends OpKey> =
  Res<K> extends { data: (infer T)[] } ? T : Res<K> extends (infer T)[] ? T : never;
