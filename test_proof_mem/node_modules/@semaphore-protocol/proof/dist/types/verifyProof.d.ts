import { FullProof } from "./types";
/**
 * Verifies a Semaphore proof.
 * @param fullProof The SnarkJS Semaphore proof.
 * @param treeDepth The Merkle tree depth.
 * @returns True if the proof is valid, false otherwise.
 */
export default function verifyProof({ merkleTreeRoot, nullifierHash, externalNullifier, signal, proof }: FullProof, treeDepth: number): Promise<boolean>;
