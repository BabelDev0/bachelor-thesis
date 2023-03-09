import { RLN, Registry, Cache, genExternalNullifier } from 'rlnjs';
import * as path from 'path';
import * as fs from 'fs';
import poseidon from 'poseidon-lite';

const bench = async (depth) => {
	console.log('START' + depth);
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
	const epoch = genExternalNullifier('t');
	const signal = 't';

	const startP = Date.now();
	let start = Date.now();
	const merkleProof = registry.generateMerkleProof(identityCommitment);
	let end = Date.now();
	console.log('merkleProof time: ' + (end - start) / 1000 + 's');

	start = Date.now();
	const proof = await rlnInstance.generateProof(signal, merkleProof, epoch);
	end = Date.now();
	console.log('rln proof time: ' + (end - start) / 1000 + 's');
	const endP = Date.now();
	console.log('rln full proof time: ' + (endP - startP) / 1000 + 's');

	const startV = Date.now();
	start = Date.now();
	const rootCheck = registry.root === proof.publicSignals.root;
	end = Date.now();
	console.log('verify root time: ' + (end - start) / 1000 + 's');

	start = Date.now();
	const bannedCheck = registry.slashedMembers.includes(identityCommitment);
	end = Date.now();
	console.log('verify banned time: ' + (end - start) / 1000 + 's');

	start = Date.now();
	const proofVerify = await RLN.verifyProof(vKey, proof);
	end = Date.now();
	console.log('verify validity time: ' + (end - start) / 1000 + 's');

	let result = cache.addProof(proof);
	const breachCheck = result.status === 'breach';
	end = Date.now();
	console.log('verify breach time: ' + (end - start) / 1000 + 's');
	const endV = Date.now();
	console.log('rln full verification time: ' + (endV - startV) / 1000 + 's');

	console.log('END' + depth);
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
