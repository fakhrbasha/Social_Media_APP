import z from "zod";
import { confirmEmailSchema, forgotPasswordSchema, resendOtpSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./user.validation";


export type ISignUpType = z.infer<typeof signUpSchema.body>
export type IResetPasswordType = z.infer<typeof resetPasswordSchema.body>
export type IForgotPasswordType = z.infer<typeof forgotPasswordSchema.body>
export type ISignInType = z.infer<typeof signInSchema.body>
export type IConfirmEmailType = z.infer<typeof confirmEmailSchema.body>
export type IResendOtpType = z.infer<typeof resendOtpSchema.body>
