import {
    ACCESS_SECRET_KEY_ADMIN,
    ACCESS_SECRET_KEY_USER,
    PREFIX_ADMIN,
    PREFIX_USER
} from "../../config/config.service";
import { AppError } from "./global-error-handling";
import TokenService from "../utils/jwt/jwt.service";
import userModel from "../../DB/models/user.model";
export const authenticationFunc = async (
    authorization: string
) => {

    interface IJwtPayload {
        id: string;
        email?: string;
    }
    if (!authorization) {
        throw new AppError("Unauthorized", 401);
    }
    const [prefix, token] =
        authorization.split(" ");
    let ACCESS_SECRET_KEY = "";
    if (prefix === PREFIX_USER) {
        ACCESS_SECRET_KEY =
            ACCESS_SECRET_KEY_USER!;
    } else if (prefix === PREFIX_ADMIN) {
        ACCESS_SECRET_KEY =
            ACCESS_SECRET_KEY_ADMIN!;
    } else {
        throw new AppError(
            "Invalid Prefix Key",
            400
        );
    }
    if (!token) {
        throw new AppError(
            "Invalid token format",
            401
        );
    }

    const decoded =
        TokenService.verifyToken({
            token,
            secretKey: ACCESS_SECRET_KEY
        }) as IJwtPayload;

    if (!decoded?.id) {
        throw new AppError(
            "Invalid token",
            401
        );
    }

    const user = await userModel.findOne({
        _id: decoded.id
    });

    if (!user) {
        throw new AppError(
            "User not found",
            404
        );
    }

    if (!user.confirmed) {
        throw new AppError(
            "User not confirmed",
            400
        );
    }

    return {
        user,
        decoded
    };
};