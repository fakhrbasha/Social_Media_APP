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
exports.getUSerSchema = exports.resendOtpSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.updatePasswordSchema = exports.confirmEmailSchema = exports.signUpSchema = exports.signInSchema = void 0;
const z = __importStar(require("zod"));
const user_enum_1 = require("../../common/enum/user.enum");
exports.signInSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email(),
        password: z.string({ error: "password is required" }).min(6)
    })
};
exports.signUpSchema = {
    body: exports.signInSchema.body.safeExtend({
        username: z.string({ error: "username is required" }).min(3).max(25),
        confirmPassword: z.string({ error: "confirm password is required" }).min(6),
        age: z.number({ error: "age is required" }).min(15).max(60),
        gender: z.enum(user_enum_1.GenderEnum).optional(),
        address: z.string().min(10).max(100).optional(),
        phone: z.string().min(10).max(15).optional(),
        confirmed: z.boolean().optional(),
        provider: z.enum(user_enum_1.providerEnum).optional(),
        friends: z.string().optional()
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, {
        message: "password and confirm password must be the same",
        path: ["confirmPassword"]
    })
};
exports.confirmEmailSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email(),
        otp: z.string({ error: "otp is required" }).min(6).max(6)
    })
};
exports.updatePasswordSchema = {
    body: z.object({
        oldPassword: z.string({ error: "old password is required" }).min(6),
        newPassword: z.string({ error: "new password is required" }).min(6)
    })
};
exports.forgotPasswordSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email()
    })
};
exports.resetPasswordSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email(),
        otp: z.string({ error: "otp is required" }).min(6).max(6),
        newPassword: z.string({ error: "new password is required" }).min(6)
    })
};
exports.resendOtpSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email(),
    })
};
exports.getUSerSchema = z.strictObject({
    token: z.string()
});
