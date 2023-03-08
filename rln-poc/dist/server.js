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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http = __importStar(require("http"));
const rlnjs_1 = require("rlnjs");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const poseidon_lite_1 = __importDefault(require("poseidon-lite"));
// create a server instance and wrap it with the socket.io server
const server = http.createServer();
const io = new socket_io_1.Server(server);
const rln_identifier = BigInt(10000);
const registry = new rlnjs_1.Registry();
const cache = new rlnjs_1.Cache(rln_identifier);
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
function interaction(data, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(data);
        const proof = data;
        if (registry.root !== BigInt(proof.publicSignals.merkleRoot)) {
            console.log(registry.root, proof.publicSignals.merkleRoot);
            console.log('Merkle root mismatch');
            return;
        }
        const proofResult = yield rlnjs_1.RLN.verifyProof(vKey, proof);
        console.log(proofResult);
        if (proofResult) {
            console.log('Proof verified');
            const res = cache.addProof(proof);
            console.log('Stato: ', res.status);
            socket.emit('response', res.status);
            if (res.secret)
                registry.slashMember((0, poseidon_lite_1.default)([res.secret]));
        }
        else {
            console.log('Proof not verified');
        }
    });
}
//# sourceMappingURL=server.js.map