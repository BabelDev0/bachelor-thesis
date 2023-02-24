import { SnarkJSProof, Proof } from "./types";
/**
 * Unpacks a proof into its original form.
 * @param proof The proof compatible with Semaphore.
 * @returns The proof compatible with SnarkJS.
 */
export default function unpackProof(proof: Proof): SnarkJSProof;
