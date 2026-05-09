import { HydratedDocument } from "mongoose";
import { IUser } from "../DB/models/user.model";
import { JwtPayload } from "jsonwebtoken";

// declare global {
//     namespace Express {
//         interface Request {
//             user?: UserDocument;
//             decoded?: ITokenPayload;
//         }
//     }
// }

// two way for ifx error req
// interface IRequest extends Request {
//     user?: HydratedDocument<IUser>
//     decoded?: JwtPayload
// }
// req: IRequest and when use in endpoint use req:IRequest not req:request



// only this can fix err 
declare module "express-serve-static-core" {
    interface Request {
        user: HydratedDocument<IUser>,
        decoded: JwtPayload
    }
}