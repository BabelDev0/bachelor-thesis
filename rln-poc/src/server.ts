import { Server } from 'socket.io';
import * as http from 'http';
import { RLN, Registry, Cache, genExternalNullifier, RLNFullProof } from 'rlnjs';
import * as path from 'path';
import * as fs from 'fs';
import poseidon from 'poseidon-lite'

// create a server instance and wrap it with the socket.io server
const server = http.createServer();
const io = new Server(server);

const rln_identifier = BigInt(10000);
const registry = new Registry();
const cache = new Cache(rln_identifier);

const zkeyFilesPath = './zkeyFiles';
const vkeyPath = path.join(zkeyFilesPath, 'verification_key.json');
const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

// listen for the 'connection' event
io.on('connection', (socket) => {
	console.log('a user connected');

	// listen for the 'register' event
	socket.on('register', (data) => {
		console.log('eceived registration data');
		registration(data, socket);
	});

	socket.on('interaction', (data) => {
		console.log(`Received interaction`);
		interaction(data, socket);
	});
});

// start listening on port 3000
server.listen(3000, () => {
	console.log('Server started on port 3000');
});

function registration(data, socket) {
	// deserialize bigint
	const identityCommitment = BigInt(data);
	registry.addMember(identityCommitment);
	console.log('Registered identity commitment');
	socket.emit('newMember', registry.export());
}

async function interaction(data, socket) {
	console.log(data);
	const proof: RLNFullProof = data;
	if (registry.root !== BigInt(proof.publicSignals.merkleRoot)) {
		console.log(registry.root, proof.publicSignals.merkleRoot);
		console.log('Merkle root mismatch'); return;
	}
	const proofResult = await RLN.verifyProof(vKey, proof);
	console.log(proofResult);
	if (proofResult) {
		console.log('Proof verified');
		const res = cache.addProof(proof);
		console.log('Stato: ', res.status);
		socket.emit('response', res.status);
		if (res.secret)
			registry.slashMember(poseidon([res.secret]));
	}
	else {
		console.log('Proof not verified');
	}
}
