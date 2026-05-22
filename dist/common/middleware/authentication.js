"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication_gql = exports.authentication = void 0;
const authFunction_1 = require("../utils/authFunction");
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    const { user, decoded } = await (0, authFunction_1.authenticationFunc)(authorization);
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
const authentication_gql = async (authorization) => {
    const { user, decoded } = await (0, authFunction_1.authenticationFunc)(authorization);
    return {
        user,
        decoded
    };
};
exports.authentication_gql = authentication_gql;
