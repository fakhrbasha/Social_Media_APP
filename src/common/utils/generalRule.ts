import { Types } from "mongoose";
import * as z from "zod";
export const generalRules = {
    id: z.string().refine((value) => {
        return Types.ObjectId.isValid(value)
    }, {
        message: "id must be a valid ID"
    }),

    file: z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string(),
        size: z.number(),
        path: z.string().optional(),
        Buffer: z.any().optional(),

    })
}