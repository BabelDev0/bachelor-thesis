import { SnarkJSProof, Proof } from "./types";
/**
 * Packs a proof into a format compatible with Semaphore.
 * @param originalProof The proof generated with SnarkJS.
 * @returns The proof compatible with Semaphore.
 */
export default function packProof(originalProof: SnarkJSProof): Proof;
