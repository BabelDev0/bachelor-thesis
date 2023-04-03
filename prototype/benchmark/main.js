import { RLN, Registry, Cache, genExternalNullifier } from 'rlnjs';
import * as path from 'path';
import * as fs from 'fs';

const bench = async (depth) => {
	console.log('START ' + depth);
	const zkeyFilesPath = './zkeyFiles' + depth.toString();
	const vkeyPath = path.join(zkeyFilesPath, 'verification_key.json');
	const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
	const wasmFilePath = path.join(zkeyFilesPath, 'rln.wasm');
	const finalZkeyPath = path.join(zkeyFilesPath, 'rln_final.zkey');

	const registry = new Registry(depth);
	const rlnInstance = new RLN(wasmFilePath, finalZkeyPath, vKey);
	const identityCommitment = rlnInstance.identity.commitment;
	registry.addMember(identityCommitment);

	const cache = new Cache(rlnInstance.rlnIdentifier);
	const epoch = genExternalNullifier('test');
	const signal = 'test';

	const startP = performance.now();
	// test merkle proof generation
	let start = performance.now();
	const merkleProof = registry.generateMerkleProof(identityCommitment);
	let end = performance.now();

	// test rln proof generation
	start = performance.now();
	const proof = await rlnInstance.generateProof(signal, merkleProof, epoch);
	end = performance.now();
	const endP = performance.now();

	console.log('merkleProof time: ' + (end - start) + ' ms');
	console.log('rln proof time: ' + (end - start) + ' ms');
	console.log('rln full proof time: ' + (endP - startP) + ' ms');

	const startV = performance.now();
	// test root verification
	start = performance.now();
	const rootCheck = registry.root === proof.publicSignals.root;
	end = performance.now();

	// test banned verification
	start = performance.now();
	const bannedCheck = registry.slashedMembers.includes(identityCommitment);
	end = performance.now();

	// test proof verification
	start = performance.now();
	const proofVerify = await RLN.verifyProof(vKey, proof);
	end = performance.now();

	// test breach verification
	let result = cache.addProof(proof);
	const breachCheck = result.status === 'breach';
	end = performance.now();

	const endV = performance.now();
	console.log('verify root time: ' + (end - start) + ' ms');
	console.log('verify banned time: ' + (end - start) + ' ms');
	console.log('verify validity time: ' + (end - start) + ' ms');
	console.log('verify breach time: ' + (end - start) + ' ms');
	console.log('rln full verification time: ' + (endV - startV) + ' ms');

	console.log('END ' + depth);
};

const main = async () => {
	console.log('---------- 16 ------------');
	const benc16 = await bench(16);
	console.log('---------- 24 ------------');
	const benc24 = await bench(24);
	console.log('---------- 32 ------------');
	const benc32 = await bench(32);
};

main();
