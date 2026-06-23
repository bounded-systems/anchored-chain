import type { Digest } from "./types.ts";

/** Store interface providing derivation lineage traversal queries. */
export interface LineageCapable {
  /** Lineage queries. */
  readonly lineage: {
    /** Find all input derivations (transitive). */
    ancestors(derivationId: Digest): Promise<Digest[]>;
    /** Find all dependent derivations (transitive). */
    descendants(derivationId: Digest): Promise<Digest[]>;
    /** Check if derivation is stale relative to current refs. */
    isStale(derivationId: Digest, currentRefs: Readonly<Record<string, Digest>>): Promise<boolean>;
  };
}

/** Find all derivations that contributed inputs (directly or transitively) to a derivation. */
export async function ancestors(store: LineageCapable, derivationId: Digest): Promise<Digest[]> {
  return store.lineage.ancestors(derivationId);
}

/** Find all derivations whose inputs include outputs of a derivation. */
export async function descendants(store: LineageCapable, derivationId: Digest): Promise<Digest[]> {
  return store.lineage.descendants(derivationId);
}

/** Check if a derivation is invalidated relative to current reference snapshots. */
export async function isStale(
  store: LineageCapable,
  derivationId: Digest,
  currentRefs: Readonly<Record<string, Digest>>,
): Promise<boolean> {
  return store.lineage.isStale(derivationId, currentRefs);
}
