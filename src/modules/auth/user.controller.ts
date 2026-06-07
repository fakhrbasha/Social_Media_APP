import { Router } from "express";
import UserService from "./user.service";
import * as userValidation from "./user.validation";
import { validation } from "../../common/middleware/validation";
import { authentication } from "../../common/middleware/authentication";
import { auth } from "google-auth-library";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import chatRouter from "../chat/chat.controller";
const authRouter = Router();

authRouter.use('/:userId/chat', chatRouter)

authRouter.post('/signup', validation(userValidation.signUpSchema), UserService.signup);
authRouter.post('/confirm-email', validation(userValidation.confirmEmailSchema), UserService.confirmEmail);
authRouter.post('/signin', validation(userValidation.signInSchema), UserService.signin);
authRouter.post('/resend-otp', validation(userValidation.resendOtpSchema), UserService.reSendOtp)
authRouter.post('/signup/gmail', UserService.signinWithGoogle)
authRouter.post('/update-password', validation(userValidation.updatePasswordSchema), authentication, UserService.updatePassword);
authRouter.post('/forgot-password', validation(userValidation.forgotPasswordSchema), UserService.forgetPassword);
authRouter.post('/reset-password', validation(userValidation.resetPasswordSchema), UserService.resetPassword);
authRouter.post('/logout', authentication, UserService.logOut);
authRouter.post('/upload-image', authentication, multerCloud().single("attachment"), UserService.uploadImage)
authRouter.post('/upload-large-file', authentication, multerCloud({ store_type: Store_Enum.disk }).single("attachment"), UserService.uploadLargeFile)

authRouter.post('/upload-files', multerCloud().array("attachments", 10), UserService.uploadFiles)


authRouter.post("/uploadFileWithoutMulter", authentication, UserService.uploadFileWithoutMulter)



authRouter.get("/getMyProfile", authentication, UserService.getMyProfile)
authRouter.get("/getProfile", authentication, UserService.getProfile)


export default authRouter;