import { RLN, Registry, Cache, RLNFullProof } from 'rlnjs';
import poseidon from 'poseidon-lite';
import { Server } from 'socket.io';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import {
	EventType,
	UserRegistrationStatus,
	SignalVerificationStatus,
} from './types';

const zkeyFilesPath = './circuits-file';
const vkeyPath = path.join(zkeyFilesPath, 'verification_key.json');
const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

const server = http.createServer();
const io = new Server(server);

const rln_identifier = BigInt(5986214);
const registry = new Registry();
const cache = new Cache(rln_identifier);

const onError = (callback, error) => {
	callback({
		header: 'error',
		body: error,
	});
};

const serializeLeaves = (leaves) => {
	const serialized = [];
	leaves.forEach((leaf) => {
		serialized.push(leaf.toString());
	});
	return serialized;
};

io.on('connection', (socket) => {
	socket.on(EventType.REGISTER, (data, callback) => {
		try {
			console.log(`Received registration request`);
			const identityCommitment = BigInt(data);

			if (registry.indexOf(identityCommitment) !== -1) {
				callback({
					header: 'ok',
					body: UserRegistrationStatus.ALREADY_REGISTERED,
				});
				console.log('User already registered');
				return;
			}
			try {
				registry.addMember(identityCommitment);
			} catch (error) {
				onError(callback, UserRegistrationStatus.BANNED);
				console.log('User is Banned');
				return;
			}
			console.log('Registered identity commitment');
			console.log(registry.members);
			socket.broadcast.emit(
				EventType.USER_REGISTERED,
				serializeLeaves(registry.members)
			);
			callback({
				header: 'ok',
				body: {
					status: UserRegistrationStatus.VALID,
					leaves: serializeLeaves(registry.members),
				},
			});
		} catch (error) {
			onError(callback, error.toString());
		}
	});

	socket.on(EventType.INTERACTION, async (data, callback) => {
		try {
			const proof: RLNFullProof = data;
			if (registry.root !== BigInt(proof.publicSignals.merkleRoot)) {
				console.log('Merkle root mismatch');
				callback({
					header: 'error',
					body: SignalVerificationStatus.BREACH,
				});
				return;
			}
			const proofResult = await RLN.verifyProof(vKey, proof);
			if (!proofResult) {
				console.log('Proof not valid');
				return;
			}

			const res = cache.addProof(proof);
			if (res.status === 'breach') {
				console.log('Breach detected');
				const identityCommitment = poseidon([res.secret]);
				registry.slashMember(identityCommitment);
				socket.broadcast.emit(
					EventType.USER_SLASHED,
					serializeLeaves(registry.members)
				);
				callback({
					header: 'error',
					body: SignalVerificationStatus.BREACH,
				});
			}

			if (res.status === 'invalid') {
				console.log('Invalid signal');
				callback({
					header: 'ok',
					body: SignalVerificationStatus.INVALID,
				});
			}

			console.log('Valid signal ' + res.msg);
			callback({
				header: 'ok',
				body: SignalVerificationStatus.VALID,
			});
			// elaboration of the signal
		} catch (error) {
			onError(callback, error.toString());
		}
	});
});

server.listen(3000, () => {
	console.log('Server started on port 3000');
});
