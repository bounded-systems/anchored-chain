// Type exports: core domain model
export type {
  ActionPlan,
  ApplyResult,
  ContractId,
  Derivation,
  Digest,
  Ref,
  RefLogEntry,
  SurfaceRef,
  VerdictResult,
} from "./types.ts";

// Type exports: storage port contracts
export type {
  Applier,
  ContractRegistry,
  Fetcher,
} from "./interfaces.ts";

// Re-export CAS substrate for ref consumers
export type { BlobStore } from "@bounded-systems/cas";

// Ref storage port and error
export type { RefStore } from "./ref-store.ts";
export { RefMismatchError } from "./ref-store.ts";

// Derivation storage port
export type {
  DerivationInputRow,
  DerivationOutputRow,
  DerivationStore,
} from "./derivation-store.ts";

// Digest utilities
export { canonicalJson, digestManifest } from "./digest.ts";
export { sha256BareHex, sha256Hex } from "@bounded-systems/cas";

// Invalidation queries
export {
  descendants as invalidateDescendants,
  type InvalidationCapable,
} from "./invalidate.ts";

// Lineage queries
export {
  ancestors,
  descendants as lineageDescendants,
  isStale,
  type LineageCapable,
} from "./lineage.ts";

// Composed store interface
export type { AnchoredChainStore } from "./store.ts";

// Validation engine
export type { Verdict, ValidationCapable, VerifyOptions } from "./validate.ts";
export { validateRef, validateDerivation } from "./validate.ts";

// in-toto alignment: Statement, Envelope, Signer/Verifier
export type {
  DerivationPredicate,
  DsseEnvelope,
  DsseSignature,
  InTotoDigestSet,
  InTotoStatement,
  InTotoSubject,
  Signer,
  Verifier,
} from "./in-toto.ts";
export {
  assembleEnvelope,
  dssePae,
  manifestToStatement,
  statementToManifest,
  DERIVATION_PREDICATE_TYPE,
  DSSE_PAYLOAD_TYPE,
  STATEMENT_TYPE,
} from "./in-toto.ts";

// Signing: ed25519 keypair and Signer/Verifier implementations
export type { Ed25519Keypair } from "./signing.ts";
export {
  ed25519Keyid,
  ed25519Signer,
  ed25519Verifier,
  generateEd25519Keypair,
  importEd25519PrivateKey,
  importEd25519PublicKey,
} from "./signing.ts";

// Guard factory functions for common validation patterns
export {
  contractHolds,
  refAtDigest,
  refIsFresh,
  type GuardCtx,
  type GuardFn,
  type GuardResult,
} from "./guards.ts";

// Projections: composable view computations
export type {
  Projection,
  ProjectionCapable,
  RefProjectionView,
} from "./projections.ts";
export { projectRef, projectMany } from "./projections.ts";
