"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hash = Hash;
exports.Compare = Compare;
const bcrypt_1 = require("bcrypt");
const config_service_1 = require("../../../config/config.service");
function Hash({ plan_text, salt_round = config_service_1.SALT_ROUND }) {
    if (!plan_text) {
        throw new Error("Plan text is required for hashing");
    }
    return (0, bcrypt_1.hashSync)(plan_text.toString(), Number(salt_round));
}
function Compare({ plan_text, cipher_text }) {
    if (!plan_text || !cipher_text) {
        throw new Error("Both plan text and cipher text are required for comparison");
    }
    return (0, bcrypt_1.compareSync)(plan_text, cipher_text);
}
