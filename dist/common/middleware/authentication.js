"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const global_error_handling_1 = require("../utils/global-error-handling");
const config_service_1 = require("../../config/config.service");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const jwt_service_1 = __importDefault(require("../utils/jwt/jwt.service"));
const userModel = new user_repository_1.default();
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        throw new global_error_handling_1.AppError("Unauthorized", 401);
    }
    const [prefix, token] = authorization.split(" ");
    let ACCESS_SECRET_KEY = '';
    if (prefix == config_service_1.PREFIX_USER) {
        ACCESS_SECRET_KEY = config_service_1.ACCESS_SECRET_KEY_USER;
    }
    else if (prefix == config_service_1.PREFIX_ADMIN) {
        ACCESS_SECRET_KEY = config_service_1.ACCESS_SECRET_KEY_ADMIN;
    }
    else {
        throw new global_error_handling_1.AppError("InValid Prefix Key", 400);
    }
    if (!token) {
        throw new global_error_handling_1.AppError("invalid token format", 401);
    }
    const decoded = jwt_service_1.default.verifyToken({
        token,
        secretKey: ACCESS_SECRET_KEY
    });
    if (!decoded || !decoded?.id) {
        throw new global_error_handling_1.AppError("Invalid token", 401);
    }
    const user = await userModel
        .findOne({ filter: { _id: decoded.id } });
    if (!user) {
        throw new global_error_handling_1.AppError("User not found", 404);
    }
    if (!user.confirmed) {
        throw new global_error_handling_1.AppError("user not confirmed", 400);
    }
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
