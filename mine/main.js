import { RLN, Registry, Cache, genExternalNullifier } from 'rlnjs';
import * as path from 'path';
import * as fs from 'fs';
import poseidon from 'poseidon-lite';

// This assumes you have built the circom circuits and placed them into the folder ./zkeyFiles
const zkeyFilesPath = './zkeyFiles';
const vkeyPath = path.join(zkeyFilesPath, 'verification_key.json');
const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
const wasmFilePath = path.join(zkeyFilesPath, 'rln.wasm');
const finalZkeyPath = path.join(zkeyFilesPath, 'rln_final.zkey');

// Instantiate RLN
const rlnInstance = new RLN(wasmFilePath, finalZkeyPath, vKey);

// Example of accessing the generated identity commitment
const identity = rlnInstance.identity;
const identityCommitment = rlnInstance.commitment;

console.log('Identity: ', identity);
console.log('Identity commitment: ', identityCommitment);

// generate RLN registry that contains slashed registry
const registry = new Registry(); // using the default tree depth
registry.addMember(identityCommitment);

const cache = new Cache(rlnInstance.rlnIdentifier);

// Example of generating a proof
const epoch = genExternalNullifier('test-epoch');
const signal = 'This is a test signal';

const merkleProof = registry.generateMerkleProof(identityCommitment);

const proof = await rlnInstance.generateProof(signal, merkleProof, epoch);

let result = cache.addProof(proof);
console.log(result.status); // "added" or "breach" or "invalid"

const proofResult = await RLN.verifyProof(vKey, proof);
console.log(proofResult); // true

const signal2 = 'This is a test signal2';
const proof2 = await rlnInstance.generateProof(signal2, merkleProof, epoch);
result = cache.addProof(proof2);
console.log(result); // "added" or "breach" or "invalid"

registry.slashMember(poseidon([result.secret]));

const proof3 = await rlnInstance.generateProof(signal, merkleProof, epoch);
console.log(registry.slashMember);
proof3.publicSignals.yShare = BigInt(0);
const proofResult2 = await RLN.verifyProof(vKey, proof3);
console.log(proofResult2); // false

console.log('DONE!');
