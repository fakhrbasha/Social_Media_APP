import * as z from "zod";
import { GenderEnum, providerEnum } from "../../common/enum/user.enum";


export const signInSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email(),
        password: z.string({ error: "password is required" }).min(6)
    })
}

export const signUpSchema = {
    // same append like joy
    body: signInSchema.body.safeExtend
        ({
            username: z.string({ error: "username is required" }).min(3).max(25),
            confirmPassword: z.string({ error: "confirm password is required" }).min(6),
            age: z.number({ error: "age is required" }).min(15).max(60),
            gender: z.enum(GenderEnum).optional(),
            address: z.string().min(10).max(100).optional(),
            phone: z.string().min(10).max(15).optional(),
            confirmed: z.boolean().optional(),
            provider: z.enum(providerEnum).optional()

        }).refine((data) => {
            return data.password === data.confirmPassword
        }, {
            message: "password and confirm password must be the same",
            path: ["confirmPassword"] // this will set the error message for the confirmPassword field in the response body, instead of setting the error message for the whole request body.

        })

}

// by default required if you need make it optional you can use .optional() method like this : name: z.string().min(3).max(25).optional()





export const confirmEmailSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email(),
        otp: z.string({ error: "otp is required" }).min(6).max(6)
    })
}

export const updatePasswordSchema = {
    body: z.object({
        oldPassword: z.string({ error: "old password is required" }).min(6),
        newPassword: z.string({ error: "new password is required" }).min(6)
    })
}

export const forgotPasswordSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email()
    })
}

export const resetPasswordSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email(),
        otp: z.string({ error: "otp is required" }).min(6).max(6),
        newPassword: z.string({ error: "new password is required" }).min(6)
    })
}
export const resendOtpSchema = {
    body: z.object({
        email: z.string({ error: "email is required" }).email(),
    })
}
