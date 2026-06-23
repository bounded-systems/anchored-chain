import type { Digest } from "./types.ts";

/** Store interface providing invalidation queries over derivation lineage. */
export interface InvalidationCapable {
  /** Invalidation queries. */
  readonly invalidate: {
    /** Find derivations invalidated by moving a digest. */
    descendants(movedDigest: Digest): Promise<Digest[]>
  };
}

/** Find all derivations affected by invalidation of a moved digest. */
export async function descendants(
  store: InvalidationCapable,
  movedDigest: Digest,
): Promise<Digest[]> {
  return store.invalidate.descendants(movedDigest);
}
