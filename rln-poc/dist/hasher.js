"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const circomlib_1 = require("circomlib");
function poseidonHash(inputs) {
    return (0, circomlib_1.poseidon)(inputs);
}
exports.default = poseidonHash;
//# sourceMappingURL=hasher.js.map