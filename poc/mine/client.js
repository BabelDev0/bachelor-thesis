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

socket.on('connect', () => {
	console.log('Connected to server');

	const rlnInstance = new RLN(
		wasmFilePath,
		finalZkeyPath,
		vKey,
		rln_identifier,
		secret
	);

	const identity = rlnInstance.identity;
	console.log('Identity: ', identity);

	// emit the 'register' event with some data
	socket.emit('register', identity);

	// send in 4 interactin event with string "ciao"
	for (let i = 0; i < 4; i++) {
		socket.emit('interaction', secret);
	}
});

socket.on('disconnect', () => {
	console.log('Disconnected from server');
});
