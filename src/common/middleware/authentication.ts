import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handling";
import { ACCESS_SECRET_KEY_USER, PREFIX_USER, PREFIX_ADMIN, ACCESS_SECRET_KEY_ADMIN } from "../../config/config.service";

import { IUser } from "../../DB/models/user.model";
import { HydratedDocument } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import UserRepository from "../../DB/repository/user.repository";
import redisService from "../services/redis.service";
import TokenService from "../utils/jwt/jwt.service"
interface IJwtPayload {
    id: string;
    email?: string;
}

const userModel = new UserRepository()

export const authentication = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) {
        throw new AppError("Unauthorized", 401);
    }

    const [prefix, token]: string[] = authorization.split(" ");

    let ACCESS_SECRET_KEY = ''
    if (prefix == PREFIX_USER) {
        ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_USER!
    } else if (prefix == PREFIX_ADMIN) {
        ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_ADMIN
    } else {
        throw new AppError("InValid Prefix Key", 400)
    }
    if (!token) {
        throw new AppError("invalid token format", 401);
    }
    const decoded = TokenService.verifyToken({
        token,
        secretKey: ACCESS_SECRET_KEY
    }) as IJwtPayload;
    if (!decoded || !decoded?.id) {
        throw new AppError("Invalid token", 401);
    }
    const user = await userModel
        .findOne({ filter: { _id: decoded.id } })

    if (!user) {
        throw new AppError("User not found", 404);
    }
    if (!user.confirmed) {
        throw new AppError("user not confirmed", 400)
    }

    // const revokeToken = await redisService.get({key : redisService.revoke_keys({ userId:decoded.id , jti:decoded.jti!})})

    req.user = user;
    req.decoded = decoded;
    next();
};