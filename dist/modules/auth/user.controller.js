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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const userValidation = __importStar(require("./user.validation"));
const validation_1 = require("../../common/middleware/validation");
const authentication_1 = require("../../common/middleware/authentication");
const multer_cloud_1 = __importDefault(require("../../common/middleware/multer.cloud"));
const multer_enum_1 = require("../../common/enum/multer.enum");
const chat_controller_1 = __importDefault(require("../chat/chat.controller"));
const authRouter = (0, express_1.Router)();
authRouter.use('/:userId/chat', chat_controller_1.default);
authRouter.post('/signup', (0, validation_1.validation)(userValidation.signUpSchema), user_service_1.default.signup);
authRouter.post('/confirm-email', (0, validation_1.validation)(userValidation.confirmEmailSchema), user_service_1.default.confirmEmail);
authRouter.post('/signin', (0, validation_1.validation)(userValidation.signInSchema), user_service_1.default.signin);
authRouter.post('/resend-otp', (0, validation_1.validation)(userValidation.resendOtpSchema), user_service_1.default.reSendOtp);
authRouter.post('/signup/gmail', user_service_1.default.signinWithGoogle);
authRouter.post('/update-password', (0, validation_1.validation)(userValidation.updatePasswordSchema), authentication_1.authentication, user_service_1.default.updatePassword);
authRouter.post('/forgot-password', (0, validation_1.validation)(userValidation.forgotPasswordSchema), user_service_1.default.forgetPassword);
authRouter.post('/reset-password', (0, validation_1.validation)(userValidation.resetPasswordSchema), user_service_1.default.resetPassword);
authRouter.post('/logout', authentication_1.authentication, user_service_1.default.logOut);
authRouter.post('/upload-image', authentication_1.authentication, (0, multer_cloud_1.default)().single("attachment"), user_service_1.default.uploadImage);
authRouter.post('/upload-large-file', authentication_1.authentication, (0, multer_cloud_1.default)({ store_type: multer_enum_1.Store_Enum.disk }).single("attachment"), user_service_1.default.uploadLargeFile);
authRouter.post('/upload-files', (0, multer_cloud_1.default)().array("attachments", 10), user_service_1.default.uploadFiles);
authRouter.post("/uploadFileWithoutMulter", authentication_1.authentication, user_service_1.default.uploadFileWithoutMulter);
authRouter.get("/getMyProfile", authentication_1.authentication, user_service_1.default.getMyProfile);
authRouter.get("/getProfile", authentication_1.authentication, user_service_1.default.getProfile);
exports.default = authRouter;
