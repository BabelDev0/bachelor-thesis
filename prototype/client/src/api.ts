import { RLN, Registry, genExternalNullifier } from 'rlnjs';
import {
	EventType,
	UserRegistrationStatus,
	SignalVerificationStatus,
} from './types';
import { io } from 'socket.io-client';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

const zkeyFilesPath = './circuits-file';
const vkeyPath = path.join(zkeyFilesPath, 'verification_key.json');
const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
const wasmFilePath = path.join(zkeyFilesPath, 'rln.wasm');
const finalZkeyPath = path.join(zkeyFilesPath, 'rln_final.zkey');

const socket = io('http://localhost:3000');

const userIO = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const rln_identifier = BigInt(5986214);

const treeDepth = 20;
const zeroValue = BigInt(0);
const leaves = [];

let identityCommitment: bigint;
let merkleProof;
const state = {
	isRegistered: false,
};
let rlnInstance: RLN;

const initRLN = async () => {
	const secret: string = await new Promise((resolve) => {
		userIO.question('Insert private key o r for random: ', (signal) => {
			resolve(signal);
		});
	});

	rlnInstance = new RLN(
		wasmFilePath,
		finalZkeyPath,
		vKey,
		rln_identifier,
		secret === 'r' ? undefined : secret
	);

	const identity = rlnInstance.identity;
	identityCommitment = identity.commitment;
};

const register = async (): Promise<UserRegistrationStatus> => {
	return await new Promise((resolve, reject) => {
		socket.emit(
			EventType.REGISTER,
			identityCommitment.toString(),
			async (response) => {
				if (response.header === 'error') {
					if (response.body === UserRegistrationStatus.BANNED) {
						reject('User is Banned');
					}
					reject(response.body);
				} else {
					if (response.body === UserRegistrationStatus.ALREADY_REGISTERED) {
						resolve(response.body);
						return;
					}
					state.isRegistered = true;
					refreshRegistry(response.body.leaves);
					resolve(response.body.status);
				}
			}
		);
	});
};

const options = async () => {
	const signal: string = await new Promise((resolve) => {
		userIO.question('signal: ', (signal) => {
			resolve(signal);
		});
	});

	const n = signal === 'dos' ? 100 : 1;
	const epoch = BigInt(Math.floor(Date.now() / 10000));
	const externalNullifier = genExternalNullifier(
		signal === 'dos' ? 'same' : epoch.toString()
	);

	for (let i = 0; i < n; i++) {
		const signalVerificationStatus = await interact(
			signal === 'dos' ? 'This is a DoS attack' + i : signal,
			externalNullifier
		);
		console.log('Server response: ', signalVerificationStatus);
	}
};

const interact = async (
	signal,
	externalNullifier
): Promise<SignalVerificationStatus> => {
	const proof = await rlnInstance.generateProof(
		signal,
		merkleProof,
		externalNullifier
	);

	const res: SignalVerificationStatus = await new Promise((resolve, reject) => {
		socket.emit(EventType.INTERACTION, proof, async (response) => {
			const status = response.header;
			if (status === 'error') {
				if (response.body === SignalVerificationStatus.BREACH) {
					reject('User was slashed');
				}
				reject(response.body);
			} else {
				resolve(response.body);
			}
		});
	});
	return res;
};

const refreshRegistry = (data) => {
	if (state.isRegistered) {
		for (let i = 0; i < data.length; i++) {
			leaves[i] = BigInt(data[i]);
		}

		console.log('leaves', leaves);

		merkleProof = Registry.generateMerkleProof(
			treeDepth,
			zeroValue,
			leaves,
			identityCommitment
		);
	}
};

socket.on(EventType.USER_REGISTERED, (data) => {
	console.log('New user registered!');
	refreshRegistry(data);
});

socket.on(EventType.USER_SLASHED, (data) => {
	console.log('User was slashed!');
	refreshRegistry(data);
});

socket.on('disconnect', () => {
	console.log('Disconnected from server');
});

export { initRLN, register, options };
