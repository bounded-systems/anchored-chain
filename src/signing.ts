// Phase 1 of the in-toto alignment plan — a dev/offline DSSE signer.
//
// ed25519 over the DSSE pre-authentication encoding, using only `node:crypto`
// so it stays inside the extractable core (the module import allowlist). This
// is the reference `Signer`/`Verifier` implementation and the one tests +
// offline runs use. The Sigstore keyless signer (Fulcio/Rekor, needs network +
// OIDC) is a drop-in `Signer` that lives OUTSIDE this module; see
// docs/anchored-chain/in-toto-alignment-plan.md.

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyObject,
} from "node:crypto";

import type { Signer, Verifier } from "./in-toto.ts";

/** ed25519 keypair with derived key identifier. */
export interface Ed25519Keypair {
  /** Private key object. */
  readonly privateKey: KeyObject;
  /** Public key object. */
  readonly publicKey: KeyObject;
  /** SHA256 hex digest of the SPKI DER-encoded public key. */
  readonly keyid: string;
}

/** Compute sha256 hex keyid of an ed25519 public key's SPKI DER representation. */
export function ed25519Keyid(publicKey: KeyObject): string {
  const der = publicKey.export({ type: "spki", format: "der" });
  return createHash("sha256").update(der).digest("hex");
}

/** Generate a new ed25519 keypair with derived keyid. */
export function generateEd25519Keypair(): Ed25519Keypair {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  return { privateKey, publicKey, keyid: ed25519Keyid(publicKey) };
}

/** Create a Signer that signs DSSE PAE with ed25519. */
export function ed25519Signer(privateKey: KeyObject, keyid: string): Signer {
  return {
    async sign(pae: Uint8Array) {
      const signature = cryptoSign(null, Buffer.from(pae), privateKey);
      return { sig: signature.toString("base64"), keyid };
    },
  };
}

/** Create a Verifier that verifies DSSE signatures against a single ed25519 public key. */
export function ed25519Verifier(publicKey: KeyObject): Verifier {
  return {
    async verify(pae: Uint8Array, sig) {
      try {
        return cryptoVerify(null, Buffer.from(pae), publicKey, Buffer.from(sig.sig, "base64"));
      } catch {
        return false;
      }
    },
  };
}

// --- Stable-key import (GH-2249) ---------------------------------------------
//
// Cross-process enforcement (`requireSigned`) needs a key that survives between
// the signing run and the verifying run, so a surface must be able to import key
// material from its environment into a `KeyObject`. Importing stays in the core
// (it's pure `node:crypto`, no env reads); the *choice* of material is the
// machine-side concern of `resolveProvenanceSigner` / `resolveProvenanceVerifier`.
//
// Two encodings are accepted, distinguished by decoded length:
//   - a raw 32-byte ed25519 seed (private) or point (public), DER-wrapped here;
//   - full PKCS8 (private) / SPKI (public) DER, passed through to `node:crypto`.
// Both are base64-encoded strings. The raw form is the natural one to mint and
// carry in an env var; the DER form lets a caller paste an existing key.

/** Bytes of a raw (unwrapped) ed25519 seed or public point. */
const RAW_ED25519_KEY_LEN = 32;

/** PKCS8 DER prefix for an ed25519 private key (precedes the 32-byte seed). */
const ED25519_PKCS8_DER_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

/** SPKI DER prefix for an ed25519 public key (precedes the 32-byte point). */
const ED25519_SPKI_DER_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** Import ed25519 private key from base64 (raw 32-byte seed or PKCS8 DER). */
export function importEd25519PrivateKey(material: string): KeyObject {
  const bytes = Buffer.from(material, "base64");
  const der =
    bytes.length === RAW_ED25519_KEY_LEN ? Buffer.concat([ED25519_PKCS8_DER_PREFIX, bytes]) : bytes;
  return createPrivateKey({ key: der, format: "der", type: "pkcs8" });
}

/** Import ed25519 public key from base64 (raw 32-byte point or SPKI DER). */
export function importEd25519PublicKey(material: string): KeyObject {
  const bytes = Buffer.from(material, "base64");
  const der =
    bytes.length === RAW_ED25519_KEY_LEN ? Buffer.concat([ED25519_SPKI_DER_PREFIX, bytes]) : bytes;
  return createPublicKey({ key: der, format: "der", type: "spki" });
}
