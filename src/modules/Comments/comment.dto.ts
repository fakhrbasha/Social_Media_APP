import z from "zod";
import { createCommentSchema } from "./comment.validation";


export type ICreateCommentDTO = z.infer<typeof createCommentSchema.body>
