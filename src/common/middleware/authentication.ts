import { NextFunction, Request, Response } from "express";
import { authenticationFunc } from "../utils/authFunction";





export const authentication = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    const { user, decoded } = await authenticationFunc(authorization!)
    // const revokeToken = await redisService.get({key : redisService.revoke_keys({ userId:decoded.id , jti:decoded.jti!})})
    req.user = user;
    req.decoded = decoded;
    next();
};





export const authentication_gql = async (
    authorization: string
) => {
    const { user, decoded } =
        await authenticationFunc(
            authorization
        );
    return {
        user,
        decoded
    };
};