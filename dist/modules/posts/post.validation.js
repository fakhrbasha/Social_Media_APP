"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikePostSchema = exports.updatePostSchema = exports.createPostSchema = void 0;
const z = __importStar(require("zod"));
const postEnum_1 = require("../../common/enum/postEnum");
const generalRule_1 = require("../../common/utils/generalRule");
exports.createPostSchema = {
    body: z.strictObject({
        content: z.string().min(3).optional(),
        attachments: z.array(generalRule_1.generalRules.file).optional(),
        tags: z.array(generalRule_1.generalRules.id).optional(),
        availability: z.enum(postEnum_1.AvailabilityEnum).default(postEnum_1.AvailabilityEnum.public),
        allowComment: z.enum(postEnum_1.AllowCommentEnum).default(postEnum_1.AllowCommentEnum.allow)
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required"
            });
        }
        if (args?.tags) {
            const uniqueTags = new Set(args.tags);
            if (uniqueTags.size !== args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "tags must be unique"
                });
            }
        }
    })
};
exports.updatePostSchema = {
    body: z.strictObject({
        content: z.string().min(3).optional(),
        attachments: z.array(generalRule_1.generalRules.file).optional(),
        tags: z.array(generalRule_1.generalRules.id).optional(),
        availability: z.enum(postEnum_1.AvailabilityEnum).optional(),
        allowComment: z.enum(postEnum_1.AllowCommentEnum).optional()
    }).superRefine((args, ctx) => {
        if (!args.content && !args.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content is required"
            });
        }
    })
};
exports.LikePostSchema = {
    params: z.strictObject({
        postId: generalRule_1.generalRules.id,
    })
};
