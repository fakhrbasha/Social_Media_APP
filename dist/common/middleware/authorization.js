"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const global_error_handling_1 = require("../utils/global-error-handling");
const authorization = (roles = []) => {
    return (req, res, next) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            throw new global_error_handling_1.AppError("Unauthorized", 403);
        }
        next();
    };
};
exports.authorization = authorization;
