import type { Request, Response, NextFunction } from "express";


export class AppError extends Error {
    constructor(public message: any, public statusCode: number= 500) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
    }
}

export const globalErrorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    // const status = err.cause as number || 500; // if err.cause is not a number, we will use 500 as the default status code
    const status = err.statusCode || 500; // if err.statusCode is not a number, we will use 500 as the default status code
    res.status(status).json({
        message: err.message,
        status,
        stack: err.stack
        // as number name -> type assertion mean that we are telling the compiler that we know that err.cause is a number, even though it might not be. This is necessary because the Error type does not have a cause property by default, so we need to tell the compiler that we are adding it ourselves.
    })
}