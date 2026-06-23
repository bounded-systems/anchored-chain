import type { DsseEnvelope } from "./in-toto.ts";

// The content address is owned by the CAS substrate; anchored-chain builds its
// derivation/ref graph on top of it and re-exposes the type as part of its own
// public surface (a Ref/Derivation is made of Digests).
import type { Digest } from "@bounded-systems/cas";
export type { Digest };

/** Branded string type for contract identifiers in validation rules. */
export type ContractId = string & { readonly __brand: "ContractId" };

/** A named reference to an immutable artifact in the content-addressed store. */
export interface Ref {
  /** Reference name identifier. */
  readonly name: string;
  /** Content address of the referenced artifact. */
  readonly digest: Digest;
  /** Timestamp of the reference update. */
  readonly ts: number;
}

/** Historical entry of a reference's content-addressed state transition. */
export interface RefLogEntry {
  /** Reference name identifier. */
  readonly name: string;
  /** Previous content address (null for creation). */
  readonly prevDigest: Digest | null;
  /** New content address. */
  readonly newDigest: Digest;
  /** Reason for the state transition. */
  readonly reason: string;
  /** Timestamp of the transition. */
  readonly ts: number;
}

/** An immutable production event: inputs → outputs with producer, contracts, and optional signature. */
export interface Derivation {
  /** Content address of this derivation (hash of manifest). */
  readonly derivationId: Digest;
  /** Production manifest: producer, inputs, outputs, enforcement contracts, and parameters. */
  readonly manifest: {
    /** Identifier of the producer service or agent. */
    readonly producer: string;
    /** Named input artifacts consumed during production. */
    readonly inputs: Readonly<Record<string, Digest>>;
    /** Named output artifacts produced during production. */
    readonly outputs: Readonly<Record<string, Digest>>;
    /** Enforced contract identifiers for this derivation. */
    readonly contracts: readonly string[];
    /** Production parameters and configuration (opaque to framework). */
    readonly params: Readonly<Record<string, unknown>>;
  };
  /** Optional DSSE-signed in-toto Statement (unsigned if absent). */
  readonly envelope?: DsseEnvelope;
  /** Timestamp of the derivation record. */
  readonly ts: number;
}

/** A reference identifier; decoupled from Ref for fetcher protocols. */
export interface SurfaceRef {
  /** Reference name to fetch. */
  readonly name: string;
}

/** Specification for an action to be applied during contract enforcement. */
export interface ActionPlan {
  /** Producer service identifier. */
  readonly producer: string;
}

/** Outcome of a contract apply operation. */
export interface ApplyResult {
  /** Whether the action succeeded. */
  readonly ok: boolean;
}

/** Outcome of a contract validation check with optional failure reason. */
export interface VerdictResult {
  /** Whether the contract passed. */
  readonly ok: boolean;
  /** Failure reason if contract failed. */
  readonly reason?: string;
}
