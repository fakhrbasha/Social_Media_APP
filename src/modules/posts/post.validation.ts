import * as z from "zod";
import { AllowCommentEnum, AvailabilityEnum } from "../../common/enum/postEnum";
import { Types } from "mongoose";
import { generalRules } from "../../common/utils/generalRule";



export const createPostSchema = {
    body: z.strictObject({
        content: z.string().min(3).optional(),
        // attachments: z.array(z.any()).optional(),
        attachments: z.array(generalRules.file).optional(),

        // tags: z.array(z.string().refine((value) => {
        //     return Types.ObjectId.isValid(value)
        // }, {
        //     message: "tags must be a valid ID"
        // })).optional(),

        tags: z.array(generalRules.id).optional(),

        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
        allowComment: z.enum(AllowCommentEnum).default(AllowCommentEnum.allow)

    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required"
            })

        }
        // check if tags are unique
        if (args?.tags) {
            const uniqueTags = new Set(args.tags);
            if (uniqueTags.size !== args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "tags must be unique"
                })
            }
        }
    })
}

export const updatePostSchema = {
    body: z.strictObject({
        content: z.string().min(3).optional(),
        attachments: z.array(generalRules.file).optional(),
        tags: z.array(generalRules.id).optional(),
        availability: z.enum(AvailabilityEnum).optional(),
        allowComment: z.enum(AllowCommentEnum).optional()
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required"
            })
        }
    })
}

export const LikePostSchema = {
    params: z.strictObject({
        postId: generalRules.id,
    })
}
