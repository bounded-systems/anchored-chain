import type {
  ActionPlan,
  ApplyResult,
  ContractId,
  Digest,
  SurfaceRef,
  VerdictResult,
} from "./types.ts";

/** Provider for fetching artifacts by reference and checking freshness. */
export interface Fetcher {
  /** Fetch artifact content and a freshness signal. */
  fetch(ref: SurfaceRef): Promise<{
    /** Content address of the fetched artifact. */
    digest: Digest;
    /** Raw artifact bytes. */
    bytes: Uint8Array;
    /** Opaque freshness signal for future isFresh checks. */
    freshnessSignal: string;
  }>;
  /** Check if a previously-fetched artifact is still fresh. */
  isFresh(ref: SurfaceRef, lastSignal: string): Promise<boolean>;
}

/** Executor of enforcement actions during contract validation. */
export interface Applier {
  /** Execute an enforcement action plan. */
  apply(plan: ActionPlan): Promise<ApplyResult>;
}

/** Registry of contract validators keyed by artifact type. */
export interface ContractRegistry {
  /** Retrieve the validator function for a contract type. */
  getValidator(artifactType: ContractId): (digest: Digest, bytes?: Uint8Array) => VerdictResult;
}
