// Phase 0 of the in-toto alignment plan (docs/anchored-chain/in-toto-alignment-plan.md).
//
// Pure, dependency-light (node:crypto only, to satisfy extractability) mapping
// between the bespoke `Derivation['manifest']` and an in-toto Statement v1,
// plus the DSSE pre-authentication encoding and an unsigned-envelope
// assembler. No signer lives here: signing plugs in via the `Signer`/`Verifier`
// interfaces, implemented OUTSIDE this module (mirroring the bridge rule) so
// the core stays liftable into its own repo. Not re-exported from index.ts in
// Phase 0 — the public surface is pinned by import-surface.test.ts.

import type { Derivation, Digest } from "./types.ts";

/** Standard in-toto Statement v1 type URI. */
export const STATEMENT_TYPE = "https://in-toto.io/Statement/v1";
/** Anchored-chain Derivation predicate type URI for in-toto Statements. */
export const DERIVATION_PREDICATE_TYPE = "https://anchored-chain.dev/Derivation/v0.1";
/** DSSE payload type for in-toto Statement JSON. */
export const DSSE_PAYLOAD_TYPE = "application/vnd.in-toto+json";

/** in-toto digest set with algorithm and hex-encoded value. */
export interface InTotoDigestSet {
  /** SHA256 hex-encoded digest value. */
  readonly sha256: string;
}

/** in-toto subject: a named artifact with digests. */
export interface InTotoSubject {
  /** Artifact name. */
  readonly name: string;
  /** Artifact digest set. */
  readonly digest: InTotoDigestSet;
}

/** in-toto Derivation predicate: producer, inputs, outputs, and enforcement contracts. */
export interface DerivationPredicate {
  /** Producer service identifier. */
  readonly producer: string;
  /** Input artifact digests (materials). */
  readonly materials: Readonly<Record<string, InTotoDigestSet>>;
  /** Enforced contract identifiers. */
  readonly contracts: readonly string[];
  /** Production parameters. */
  readonly params: Readonly<Record<string, unknown>>;
}

/** in-toto Statement v1 over Derivation predicates. */
export interface InTotoStatement {
  /** Statement type identifier (always STATEMENT_TYPE). */
  readonly _type: typeof STATEMENT_TYPE;
  /** Output artifacts (subjects). */
  readonly subject: readonly InTotoSubject[];
  /** Predicate type identifier (always DERIVATION_PREDICATE_TYPE). */
  readonly predicateType: typeof DERIVATION_PREDICATE_TYPE;
  /** Derivation predicate. */
  readonly predicate: DerivationPredicate;
}

/** DSSE signature with optional key identifier. */
export interface DsseSignature {
  /** Base64-encoded signature bytes. */
  readonly sig: string;
  /** Optional key identifier for signature verification. */
  readonly keyid?: string;
}

/** Dead Simple Signing Envelope (DSSE) container. */
export interface DsseEnvelope {
  /** DSSE payload type (always DSSE_PAYLOAD_TYPE). */
  readonly payloadType: typeof DSSE_PAYLOAD_TYPE;
  /** Base64-encoded canonical Statement JSON. */
  readonly payload: string;
  /** Array of signatures over the PAE. */
  readonly signatures: readonly DsseSignature[];
}

/** Protocol for signing DSSE pre-authentication encodings. */
export interface Signer {
  /** Sign a DSSE PAE and return a signature. */
  sign(pae: Uint8Array): Promise<DsseSignature>;
}
/** Protocol for verifying DSSE signatures. */
export interface Verifier {
  /** Verify a DSSE signature over a PAE. */
  verify(pae: Uint8Array, sig: DsseSignature): Promise<boolean>;
}

const DIGEST_PREFIX = "sha256:";

function toHex(digest: Digest): string {
  return (digest as string).startsWith(DIGEST_PREFIX)
    ? (digest as string).slice(DIGEST_PREFIX.length)
    : (digest as string);
}

function toDigest(hex: string): Digest {
  return `${DIGEST_PREFIX}${hex}` as Digest;
}

function digestSetMap(source: Readonly<Record<string, Digest>>): Record<string, InTotoDigestSet> {
  const out: Record<string, InTotoDigestSet> = {};
  for (const [name, digest] of Object.entries(source)) {
    out[name] = { sha256: toHex(digest) };
  }
  return out;
}

/** Translate derivation manifest to in-toto Statement v1 (outputs→subjects, inputs→materials). */
export function manifestToStatement(manifest: Derivation["manifest"]): InTotoStatement {
  const subject: InTotoSubject[] = Object.entries(manifest.outputs).map(([name, digest]) => ({
    name,
    digest: { sha256: toHex(digest) },
  }));
  return {
    _type: STATEMENT_TYPE,
    subject,
    predicateType: DERIVATION_PREDICATE_TYPE,
    predicate: {
      producer: manifest.producer,
      materials: digestSetMap(manifest.inputs),
      contracts: manifest.contracts,
      params: manifest.params,
    },
  };
}

/** Translate in-toto Statement v1 to derivation manifest (inverse of manifestToStatement). */
export function statementToManifest(statement: InTotoStatement): Derivation["manifest"] {
  const inputs: Record<string, Digest> = {};
  for (const [name, set] of Object.entries(statement.predicate.materials)) {
    inputs[name] = toDigest(set.sha256);
  }
  const outputs: Record<string, Digest> = {};
  for (const s of statement.subject) {
    outputs[s.name] = toDigest(s.digest.sha256);
  }
  return {
    producer: statement.predicate.producer,
    inputs,
    outputs,
    contracts: statement.predicate.contracts,
    params: statement.predicate.params,
  };
}

/** Compute DSSE pre-authentication encoding: "DSSEv1 <len(type)> <type> <len(payload)> <payload>". */
export function dssePae(payloadType: string, payload: Uint8Array): Uint8Array {
  const enc = new TextEncoder();
  const typeBytes = enc.encode(payloadType);
  const prefix = enc.encode(`DSSEv1 ${typeBytes.length} ${payloadType} ${payload.length} `);
  const out = new Uint8Array(prefix.length + payload.length);
  out.set(prefix, 0);
  out.set(payload, prefix.length);
  return out;
}

/** Assemble unsigned DSSE envelope and PAE over a Statement (ready for Signer). */
export function assembleEnvelope(statement: InTotoStatement): {
  envelope: DsseEnvelope;
  pae: Uint8Array;
} {
  const json = JSON.stringify(statement);
  const bytes = new TextEncoder().encode(json);
  return {
    envelope: {
      payloadType: DSSE_PAYLOAD_TYPE,
      payload: Buffer.from(bytes).toString("base64"),
      signatures: [],
    },
    pae: dssePae(DSSE_PAYLOAD_TYPE, bytes),
  };
}
