import * as z from "zod";
import { generalRules } from "../../common/utils/generalRule";



export const createCommentSchema = {
    body: z.strictObject({
        content: z.string().min(3).optional(),
        attachments: z.array(generalRules.file).optional(),
        tags: z.array(generalRules.id).optional(),
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content or attachment is required"
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
    }),

    params: z.strictObject({
        postId: generalRules.id
    })
}


export const createReplySchema = {
    body: z.strictObject({
        content: z.string().min(3).optional(),
        attachments: z.array(generalRules.file).optional(),
        tags: z.array(generalRules.id).optional(),
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content or attachment is required"
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
    }),
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id
    })
}

export const likeCommentSchema = {
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id
    })
}


export const deleteCommentSchema = {
    params: z.strictObject({
        commentId: generalRules.id,
        postId: generalRules.id
    })
}

export const updateCommentSchema = {
    body: z.strictObject({
        content: z.string().min(3).optional(),
        attachments: z.array(generalRules.file).optional(),
        tags: z.array(generalRules.id).optional(),
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content or attachment is required"
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
    }),
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id
    })
}

export const updateReplySchema = {
    body: z.strictObject({
        content: z.string().min(3).optional(),
        attachments: z.array(generalRules.file).optional(),
        tags: z.array(generalRules.id).optional(),
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content or attachment is required"
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
    }),
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id
    })
}