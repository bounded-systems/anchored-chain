import type { Derivation, Digest } from "./types.ts";

/** A derivation's named input artifact in the content-addressed store. */
export interface DerivationInputRow {
  /** Name of the input artifact. */
  readonly inputName: string;
  /** Content address of the input artifact. */
  readonly inputDigest: Digest;
}

/** A derivation's named output artifact in the content-addressed store. */
export interface DerivationOutputRow {
  /** Name of the output artifact. */
  readonly outputName: string;
  /** Content address of the output artifact. */
  readonly outputDigest: Digest;
}

/** Storage backend for immutable derivations and their lineage queries. */
export interface DerivationStore {
  /** Append a new derivation record to the store. */
  append(derivation: Derivation): Promise<void>;
  /** Retrieve a derivation by its content address. */
  get(derivationId: Digest): Promise<Derivation | null>;
  /** List input artifacts of a derivation. */
  listInputs(derivationId: Digest): Promise<readonly DerivationInputRow[]>;
  /** List output artifacts of a derivation. */
  listOutputs(derivationId: Digest): Promise<readonly DerivationOutputRow[]>;
  /** Reverse lookup: derivation ids that produced a given output artifact. */
  derivationsByOutput(outputDigest: Digest): Promise<readonly Digest[]>;
}
