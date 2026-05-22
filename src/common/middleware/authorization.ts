import { NextFunction, Request, Response } from "express";
import { RoleEnum } from "../enum/user.enum";
import { AppError } from "../utils/global-error-handling";
import { GraphQLError } from "graphql";


export const authorization = async (roles: RoleEnum[] = []) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            throw new AppError("Unauthorized", 403);
        }

        next();
    }
}

export const authorization_GQL = async (roles: string[], role: string) => {
    if (!roles.includes(role)) {
        throw new GraphQLError("authorization failed", {
            extensions: {
                code: "FORBIDDEN",
                status: 403,
                message: "you don't have permission to access this resources"
            }
        })
    }
}