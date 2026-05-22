"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization_GQL = exports.authorization = void 0;
const global_error_handling_1 = require("../utils/global-error-handling");
const graphql_1 = require("graphql");
const authorization = async (roles = []) => {
    return (req, res, next) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            throw new global_error_handling_1.AppError("Unauthorized", 403);
        }
        next();
    };
};
exports.authorization = authorization;
const authorization_GQL = async (roles, role) => {
    if (!roles.includes(role)) {
        throw new graphql_1.GraphQLError("authorization failed", {
            extensions: {
                code: "FORBIDDEN",
                status: 403,
                message: "you don't have permission to access this resources"
            }
        });
    }
};
exports.authorization_GQL = authorization_GQL;
