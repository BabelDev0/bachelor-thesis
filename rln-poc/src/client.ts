import { io } from 'socket.io-client';
import { RLN, Registry, Cache, genExternalNullifier } from 'rlnjs';
import * as path from 'path';
import * as fs from 'fs';

const zkeyFilesPath = './zkeyFiles';
const vkeyPath = path.join(zkeyFilesPath, 'verification_key.json');
const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
const wasmFilePath = path.join(zkeyFilesPath, 'rln.wasm');
const finalZkeyPath = path.join(zkeyFilesPath, 'rln_final.zkey');

// create a random bigint
const rln_identifier = BigInt(10000);
// create a random secret
const secret = 'questo è il mio segreto';

const socket = io('http://localhost:3000');

const rlnInstance = new RLN(
	wasmFilePath,
	finalZkeyPath,
	vKey,
	rln_identifier,
	secret
);

let registry = new Registry();

const identity = rlnInstance.identity;
const identityCommitment = identity.commitment;
console.log('identityCommitment: ', identityCommitment);
socket.on('connect', () => {
	console.log('Connected to server');

	// emit the 'register' event with some data
	socket.emit('register', serializeBigInt(identityCommitment));
});

socket.on('disconnect', () => {
	console.log('Disconnected from server');
});

socket.on('newMember', (data: string) => {
	console.log('Received new member data');
	registry = Registry.import(data);

	interaction();
});

socket.on('response', (data: string) => {
	console.log('Received response: ', data);
});

// serialize bigint
function serializeBigInt(bigint): string {
	return bigint.toString();
}

async function interaction() {

	const merkleProof = registry.generateMerkleProof(identityCommitment);
	const epoch = BigInt(Math.floor(Date.now() / 10000))
	const externalNullifier = genExternalNullifier("mio");
	const signal1 = 'This is a test signal';
	const signal2 = 'This is another test signal';
	const signal3 = 'dai';
	const signal4 = 'su';
	const proof = await rlnInstance.generateProof(signal1, merkleProof, externalNullifier);
	const proof2 = await rlnInstance.generateProof(signal2, merkleProof, externalNullifier);
	const proof3 = await rlnInstance.generateProof(signal3, merkleProof, externalNullifier);
	const proof4 = await rlnInstance.generateProof(signal4, merkleProof, externalNullifier);
	socket.emit('interaction', proof);
	// sleep for 1 second
	await new Promise((resolve) => setTimeout(resolve, 1000));
	socket.emit('interaction', proof2);
	await new Promise((resolve) => setTimeout(resolve, 1000));
	socket.emit('interaction', proof3);
	// socket.emit('interaction', proof4);
}
