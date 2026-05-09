import z from "zod";
import { createPostSchema } from "./post.validation";


export type ICreatePostDTO = z.infer<typeof createPostSchema.body>
