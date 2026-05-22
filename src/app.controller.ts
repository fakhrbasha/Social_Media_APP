import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { PORT } from "./config/config.service";
import { AppError, globalErrorHandler } from "./common/utils/global-error-handling";
import authRouter from "./modules/auth/user.controller";
import { checkConnection } from "./DB/connectionDB";
import redisService from "./common/services/redis.service";
import userModel from "./DB/models/user.model";

import { pipeline } from "stream/promises"
import { s3Service, S3Service } from "./common/services/s3.service";
import notificationRouter from "./modules/notifications/notification.controller";
import postRouter from "./modules/posts/post.controller";
import commentRouter from "./modules/Comments/comment.controller";
import { GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { createHandler } from "graphql-http/lib/use/express";
import id from "zod/v4/locales/id.js";
import { gql_schema } from "./modules/graphql/graphQL.schema";
import { authentication } from "./common/middleware/authentication";
const app: express.Application = express();

const port: number = Number(PORT); // because process.env.PORT is a string, we need to convert it to a number


//

const bootstrap = () => {

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: "Too many requests, please try again later.",
        handler: (req: Request, res: Response, next: NextFunction) => {
            // res.status(429).json({ message: "Too many requests, please try again later." });
            throw new AppError("Too many requests, please try again later.", 429) // we can use the AppError class to throw an error with a custom message and status code, so that we can use it in the global error handler to set the status code of the response and send the custom message in the response body.
        }
        , legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    })

    app.use(express.json());


    async function test() {

        // const user = new userModel({
        //     firstName: "ahmed fakhr",
        //     lastName: "ahmed fakhr",
        //     email: `ahmed__${Date.now()}@gmail.com`,
        //     password: "12345",
        //     age: 16,
        //     phone: "01021329089"
        // })
        // await user.save({ validateBeforeSave: true }) // by default
        // // await user.save({ validateBeforeSave: false }) // not run hook when use validate hook

        // user.age = 37

        // await user.save()

        // const user = new userModel({})
        // // await user.updateOne({ $set: { x: 'test' } })
        // await user.deleteOne({})
        // console.log("user deleted");

    }

    test()
    checkConnection()
    redisService.connect()
    app.use(cors(), helmet(), limiter)
    app.use('/graphql', authentication, createHandler({ schema: gql_schema, context: (req) => ({ req }) }))


    app.get("/", (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({ message: "Welcome to the Social App API!" })
    })


    app.use("/auth", authRouter)
    app.use("/notifications", notificationRouter)
    app.use("/posts", postRouter)


    // get photo uploaded
    // app.get("/upload", async (req: Request, res: Response, next: NextFunction) => {
    //     const { folderName } = req.query as { folderName: string }
    //     let result = await new S3Service().getFiles(folderName)
    //     let resultMapped = result.Contents?.map((file) => {
    //         return file.Key
    //     })
    //     res.status(200).json({ message: "done", data: resultMapped })

    // })
    // app.get("/upload/pre-signed/*path", async (req: Request, res: Response, next: NextFunction) => {
    //     const { path } = req.params as { path: string[] }
    //     const { download } = req.query
    //     const Key = path.join("/") as string

    //     const url = await new S3Service().getPreSignedUrl({ Key, download: download ? download.toString() : undefined })

    //     res.status(200).json({ message: "done", data: url })
    // })
    // app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {
    //     const { path } = req.params as { path: string[] }
    //     const { download } = req.query
    //     const Key = path.join("/") as string

    //     const result = await new S3Service().getFile(Key)

    //     const stream = result.Body as NodeJS.ReadableStream

    //     res.setHeader("content-type", result.ContentType!)

    //     // download image 
    //     res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    //     if (download && download === "true") {

    //         res.setHeader("Content-Disposition", `attachment; filename="${path.pop()}"`); // only apply it for  download
    //     }

    //     await pipeline(stream, res)
    // })

    // invalid url handler

    // graphQl


    app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
        // res.status(404).json({ message: `Invalid URL ${req.originalUrl} with method ${req.method} not found`, status: 404 })
        // throw new Error(`Invalid URL ${req.originalUrl} with method ${req.method} not found`, { cause: 404 }) // we can use the cause property of the Error object to pass the status code to the global error handler, so that we can use it to set the status code of the response in the global error handler.
        throw new AppError(`Invalid URL ${req.originalUrl} with method ${req.method} not found`, 404)
    })


    // global error handler

    app.use(globalErrorHandler)

    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }

}

export { app };
export default bootstrap;