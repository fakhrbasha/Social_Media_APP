"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const expireDate = '1h';
const generateToken = ({ payload, secretKey, options = {} }) => {
    return jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn: expireDate, ...options });
};
exports.generateToken = generateToken;
const verifyToken = ({ token, secretKey, options = {} }) => {
    try {
        return jsonwebtoken_1.default.verify(token, secretKey, options);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
