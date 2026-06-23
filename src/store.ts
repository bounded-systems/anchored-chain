import type { DerivationStore } from "./derivation-store.ts";
import type { RefStore } from "./ref-store.ts";
import type { Digest } from "./types.ts";

/** Complete store interface: refs, derivations, lineage, and invalidation queries. */
export interface AnchoredChainStore {
  /** Reference storage port. */
  readonly refs: RefStore;
  /** Derivation storage port. */
  readonly derivations: DerivationStore;
  /** Invalidation queries. */
  readonly invalidate: {
    /** Find derivations invalidated by moving a digest. */
    descendants(movedDigest: Digest): Promise<Digest[]>
  };
  /** Lineage queries. */
  readonly lineage: {
    /** Find all input derivations (transitive). */
    ancestors(derivationId: Digest): Promise<Digest[]>;
    /** Find all dependent derivations (transitive). */
    descendants(derivationId: Digest): Promise<Digest[]>;
    /** Check if derivation is stale relative to current refs. */
    isStale(derivationId: Digest, currentRefs: Readonly<Record<string, Digest>>): Promise<boolean>;
  };
  /** Close the store and release resources. */
  close(): void;
}
