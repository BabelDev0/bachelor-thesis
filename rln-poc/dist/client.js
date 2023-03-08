"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const rlnjs_1 = require("rlnjs");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const zkeyFilesPath = './zkeyFiles';
const vkeyPath = path.join(zkeyFilesPath, 'verification_key.json');
const vKey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
const wasmFilePath = path.join(zkeyFilesPath, 'rln.wasm');
const finalZkeyPath = path.join(zkeyFilesPath, 'rln_final.zkey');
// create a random bigint
const rln_identifier = BigInt(10000);
// create a random secret
const secret = 'questo è il mio segreto';
const socket = (0, socket_io_client_1.io)('http://localhost:3000');
const rlnInstance = new rlnjs_1.RLN(wasmFilePath, finalZkeyPath, vKey, rln_identifier, secret);
let registry = new rlnjs_1.Registry();
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
socket.on('newMember', (data) => {
    console.log('Received new member data');
    registry = rlnjs_1.Registry.import(data);
    interaction();
});
socket.on('response', (data) => {
    console.log('Received response: ', data);
});
// serialize bigint
function serializeBigInt(bigint) {
    return bigint.toString();
}
function interaction() {
    return __awaiter(this, void 0, void 0, function* () {
        const merkleProof = registry.generateMerkleProof(identityCommitment);
        const epoch = BigInt(Math.floor(Date.now() / 10000));
        const externalNullifier = (0, rlnjs_1.genExternalNullifier)("mio");
        const signal1 = 'This is a test signal';
        const signal2 = 'This is another test signal';
        const signal3 = 'dai';
        const signal4 = 'su';
        const proof = yield rlnInstance.generateProof(signal1, merkleProof, externalNullifier);
        const proof2 = yield rlnInstance.generateProof(signal2, merkleProof, externalNullifier);
        const proof3 = yield rlnInstance.generateProof(signal3, merkleProof, externalNullifier);
        const proof4 = yield rlnInstance.generateProof(signal4, merkleProof, externalNullifier);
        socket.emit('interaction', proof);
        // sleep for 1 second
        yield new Promise((resolve) => setTimeout(resolve, 1000));
        socket.emit('interaction', proof2);
        yield new Promise((resolve) => setTimeout(resolve, 1000));
        socket.emit('interaction', proof3);
        // socket.emit('interaction', proof4);
    });
}
//# sourceMappingURL=client.js.map