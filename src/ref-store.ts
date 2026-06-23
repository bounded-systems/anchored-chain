import type { Digest, Ref, RefLogEntry } from "./types.ts";

/** Storage backend for named references with content-addressed state transitions. */
export interface RefStore {
  /** Get the current state of a reference. */
  get(name: string): Promise<Ref | null>;
  /** Compare-and-swap update of a reference. */
  cas(args: {
    /** Reference name. */
    name: string;
    /** Expected previous digest (CAS condition). */
    prevDigest: Digest | null;
    /** New digest to commit. */
    newDigest: Digest;
    /** Transition reason/justification. */
    reason: string;
    /** Transition timestamp. */
    ts: number;
  }): Promise<Ref>;
  /** Get the state of a reference at a specific timestamp. */
  asOf(name: string, ts: number): Promise<RefLogEntry | null>;
  /** Get the full state transition history of a reference. */
  log(name: string): Promise<readonly RefLogEntry[]>;
}

/** Exception raised when a compare-and-swap update fails on a reference. */
export class RefMismatchError extends Error {
  /** Error name. */
  readonly name = "RefMismatchError";
  /** Reference name that failed the CAS check. */
  readonly refName: string;
  /** Expected previous digest (condition that failed). */
  readonly expectedPrev: Digest | null;
  /** Actual current digest. */
  readonly actual: Digest | null;

  /** Initialize a RefMismatchError. */
  constructor(args: {
    refName: string;
    expectedPrev: Digest | null;
    actual: Digest | null;
  }) {
    super(
      `ref CAS mismatch on "${args.refName}": expected prev=${args.expectedPrev ?? "null"}, actual=${args.actual ?? "null"}`,
    );
    this.refName = args.refName;
    this.expectedPrev = args.expectedPrev;
    this.actual = args.actual;
  }
}
