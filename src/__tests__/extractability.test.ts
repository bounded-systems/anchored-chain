import { test } from "bun:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertSeam } from "@bounded-systems/seam-check";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// anchored-chain: pure provenance core. Prod files touch node:crypto (Ed25519 /
// digests) and the cas substrate only — no database, filesystem, subprocess, or
// process.env. The harness proves that edge and the no-ambient-authority thesis.
test("@bounded-systems/anchored-chain upholds its seam claim", () => {
  assertSeam({
    root: SRC,
    prod: ["node:crypto", "@bounded-systems/cas"],
    // @noble/ed25519 is a TEST-only, independent verifier (prx-5lcd interop proof);
    // prod still touches node:crypto only.
    test: ["@bounded-systems/anchored-chain", "@bounded-systems/seam-check", "@noble/ed25519"],
  });
});
