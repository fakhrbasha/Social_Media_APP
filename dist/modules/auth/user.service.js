"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const encrypt_1 = require("../../common/utils/security/encrypt");
const hash_1 = require("../../common/utils/security/hash");
const mail_1 = require("../../common/utils/mail/mail");
const email_template_1 = require("../../common/utils/mail/email.template");
const user_enum_1 = require("../../common/enum/user.enum");
const config_service_1 = require("../../config/config.service");
const google_auth_library_1 = require("google-auth-library");
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const node_crypto_1 = require("node:crypto");
const jwt_service_1 = __importDefault(require("../../common/utils/jwt/jwt.service"));
const email_event_1 = require("../../common/utils/mail/email.event");
const s3_service_1 = require("../../common/services/s3.service");
const notification_service_1 = __importDefault(require("../../common/services/notification.service"));
class UserService {
    _userModel = new user_repository_1.default();
    _tokenService = jwt_service_1.default;
    _redisService = redis_service_1.default;
    _s3Service = new s3_service_1.S3Service();
    _notificationServiceConfig = notification_service_1.default;
    constructor() { }
    sendEmailOtp = async ({ email, subject }) => {
        const isBlocked = await this._redisService.ttl({ key: this._redisService.block_otp_key({ email }) });
        if (isBlocked && isBlocked > 0) {
            throw new global_error_handling_1.AppError(`you have exceeded the maximum number of attempts to resend otp please try again later after ${isBlocked} seconds`, 429);
        }
        const otpTTl = await this._redisService.ttl({ key: this._redisService.otpKey({ email, subject }) });
        if (otpTTl && otpTTl > 0) {
            throw new global_error_handling_1.AppError(`you have already sent otp please check your email or try again later after ${otpTTl} seconds`, 429);
        }
        const maxOtp = await this._redisService.get({ key: this._redisService.max_otp_key({ email }) });
        if (maxOtp && maxOtp >= 3) {
            await this._redisService.setValue({ key: this._redisService.block_otp_key({ email }), value: "blocked", ttl: 60 * 5 });
            throw new global_error_handling_1.AppError(`you have exceeded the maximum number of attempts to resend otp please try again later after 300 seconds`, 429);
        }
        const otp = await (0, mail_1.sendOtp)();
        email_event_1.eventEmitter.emit(user_enum_1.EmailEnum.confirmedEmail, async () => {
            await (0, mail_1.sendEmail)({
                to: email,
                subject: "Social-media App",
                html: (0, email_template_1.templateEmail)(otp)
            });
        });
        await this._redisService.setValue({ key: this._redisService.otpKey({ email }), value: (0, hash_1.Hash)({ plan_text: `${otp}` }), ttl: 60 * 10 });
        await this._redisService.increment({ key: email });
    };
    signup = async (req, res, next) => {
        const { username, email, password, confirmPassword, age, gender, address, phone, confirmed = false, provider = user_enum_1.providerEnum.system } = req.body;
        const emailExist = await this._userModel.findOne({ filter: { email } });
        if (emailExist) {
            return next(new global_error_handling_1.AppError("Email already exists", 409));
        }
        const otp = await (0, mail_1.sendOtp)();
        email_event_1.eventEmitter.emit(user_enum_1.EmailEnum.confirmedEmail, async () => {
            await (0, mail_1.sendEmail)({
                to: email,
                subject: "Email confirmation",
                html: (0, email_template_1.templateEmail)(otp)
            });
            await this._redisService.setValue({ key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.confirmedEmail }), value: (0, hash_1.Hash)({ plan_text: `${otp}` }), ttl: 60 * 5 });
            await this._redisService.setValue({ key: this._redisService.max_otp_key({ email }), value: "1", ttl: 60 * 30 });
        });
        const user = await this._userModel.create({
            username,
            email,
            password: (0, hash_1.Hash)({ plan_text: password }),
            age,
            gender,
            address,
            phone: phone ? (0, encrypt_1.encrypt)(phone) : undefined,
            confirmed,
            provider
        });
        res.status(200).json({
            message: "User signed up successfully", data: user
        });
    };
    confirmEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const otpValue = await this._redisService.get({
            key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.confirmedEmail })
        });
        if (!otpValue) {
            return next(new global_error_handling_1.AppError("OTP expired", 400));
        }
        if (!(0, hash_1.Compare)({ plan_text: otp, cipher_text: otpValue })) {
            return next(new global_error_handling_1.AppError("Invalid OTP", 400));
        }
        const user = await this._userModel.findOne({
            filter: { email }
        });
        if (!user) {
            return next(new global_error_handling_1.AppError("User not found", 404));
        }
        const userUpdated = await this._userModel.update({ email }, { confirmed: true });
        await this._redisService.del({
            key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.confirmedEmail })
        });
        res.status(200).json({
            message: "Email confirmed successfully",
            data: userUpdated
        });
    };
    signin = async (req, res, next) => {
        const { email, password, fcm } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            return next(new global_error_handling_1.AppError("Invalid email or password", 400));
        }
        if (!(0, hash_1.Compare)({ plan_text: password, cipher_text: user.password })) {
            return next(new global_error_handling_1.AppError("Invalid email or password", 400));
        }
        const uuid = (0, node_crypto_1.randomUUID)();
        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user?.role == user_enum_1.RoleEnum.user ? config_service_1.ACCESS_SECRET_KEY_USER : config_service_1.ACCESS_SECRET_KEY_ADMIN,
            options: { jwtid: uuid }
        });
        const refresh_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user?.role == user_enum_1.RoleEnum.user ? config_service_1.REFRESH_SECRET_KEY_USER : config_service_1.REFRESH_SECRET_KEY_ADMIN,
            options: { jwtid: uuid }
        });
        if (fcm) {
            await this._redisService.addFCM({ userId: user._id, FCMToken: fcm });
            const tokens = await this._redisService.getFCMs(user._id);
            await this._notificationServiceConfig.sendNotifications({
                tokens,
                data: { title: `hi ${user.username}`, body: `new login at ${new Date().toLocaleString()}` }
            });
        }
        return res.status(200).json({
            message: "User signed in successfully",
            data: { access_token, refresh_token }
        });
    };
    reSendOtp = async (req, res, next) => {
        const { email } = req.body;
        const userExist = await this._userModel.findOne({ filter: { email } });
        if (!userExist) {
            throw new global_error_handling_1.AppError("user Not Fount", 400);
        }
        await this.sendEmailOtp({ email, subject: user_enum_1.EmailEnum.confirmedEmail });
        return res.status(200).json({ message: "message otp send successfully" });
    };
    signinWithGoogle = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client();
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new global_error_handling_1.AppError("Invalid Google token", 401);
            }
            const { name, email, email_verified, picture } = payload;
            let user = await this._userModel.findOne({ filter: { email } });
            if (!user) {
                user = await this._userModel.create({
                    email,
                    username: name,
                    confirmed: email_verified,
                    pictures: picture ? [picture] : undefined,
                    provider: user_enum_1.providerEnum.google,
                });
            }
            if (user.provider === user_enum_1.providerEnum.system) {
                throw new global_error_handling_1.AppError("Please login with email and password", 400);
            }
            const access_token = this._tokenService.generateToken({
                payload: { id: user._id },
                secretKey: config_service_1.ACCESS_SECRET_KEY_USER,
            });
            console.log(payload);
            return res.status(201).json({
                message: "User signed in with Google successfully",
                data: { access_token, user },
            });
        }
        catch (error) {
            next(error);
        }
    };
    forgetPassword = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ filter: { email } });
        if (!user) {
            return next(new global_error_handling_1.AppError("User not found", 404));
        }
        const otp = await (0, mail_1.sendOtp)();
        await (0, mail_1.sendEmail)({
            to: email,
            subject: "Reset password OTP",
            html: (0, email_template_1.templateEmail)(otp)
        });
        await this._redisService.setValue({ key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.forgetPassword }), value: (0, hash_1.Hash)({ plan_text: `${otp}` }), ttl: 60 * 5 });
        res.status(200).json({
            message: "OTP sent to email successfully"
        });
    };
    resetPassword = async (req, res, next) => {
        const { newPassword, email, otp } = req.body;
        const otpValue = await this._redisService.get({
            key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.forgetPassword })
        });
        if (!otpValue) {
            return next(new global_error_handling_1.AppError("OTP expired", 400));
        }
        if (!(0, hash_1.Compare)({ plan_text: otp, cipher_text: otpValue })) {
            return next(new global_error_handling_1.AppError("Invalid OTP", 400));
        }
        const user = await this._userModel.findOne({
            filter: { email }
        });
        if (!user) {
            return next(new global_error_handling_1.AppError("User not found", 404));
        }
        const hashedPassword = (0, hash_1.Hash)({ plan_text: newPassword });
        await this._userModel.update({ email }, { password: hashedPassword });
        await this._redisService.del({
            key: this._redisService.otpKey({ email, subject: user_enum_1.EmailEnum.forgetPassword })
        });
        res.status(200).json({
            message: "Password reset successfully"
        });
    };
    updatePassword = async (req, res, next) => {
        const { oldPassword, newPassword } = req.body;
        if (!(0, hash_1.Compare)({ plan_text: oldPassword, cipher_text: req.user.password })) {
            return next(new global_error_handling_1.AppError("Invalid old password", 400));
        }
        const hashedPassword = (0, hash_1.Hash)({ plan_text: newPassword });
        req.user.password = hashedPassword;
        await req.user.save();
        res.status(200).json({
            message: "Password updated successfully"
        });
    };
    logOut = async (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            await this._redisService.setValue({ key: token, value: "invalid", ttl: 60 * 60 });
        }
        res.status(200).json({
            message: "User logged out successfully"
        });
    };
    uploadImage = async (req, res, next) => {
        const image = await this._s3Service.uploadFile({ file: req.file, path: "users" });
        return res.status(200).json({
            message: "Image uploaded successfully",
            data: image
        });
    };
    uploadLargeFile = async (req, res, next) => {
        const file = await this._s3Service.uploadLargeFile({ file: req.file, path: "users/large" });
        return res.status(200).json({
            message: "File uploaded successfully",
            data: file
        });
    };
    uploadFiles = async (req, res, next) => {
        const files = await this._s3Service.uploadFiles({ files: req.files, path: "users/multiple", isLarge: false });
        return res.status(200).json({
            message: "Files uploaded successfully",
            data: files
        });
    };
    uploadFileWithoutMulter = async (req, res, next) => {
        const { fileName, ContentType } = req.body;
        const { url, Key } = await this._s3Service.createPreSignedUrl({ path: "users", fileName, ContentType });
        return res.status(201).json({ message: "done", data: { url, Key } });
    };
    getMyProfile = async (req, res, next) => {
        const user = await this._userModel.findOne({
            filter: { _id: req.user._id }
        });
        if (!user)
            throw new global_error_handling_1.AppError("user not found", 404);
        const userWithPosts = await this._userModel.findOne({
            filter: { _id: req.user._id },
            options: {
                populate: [
                    {
                        path: "posts",
                        model: "post",
                        select: "_id content images attachments tags createdAt updatedAt likes commentsCount repliesCount -createdBy",
                    }
                ]
            }
        });
        if (!userWithPosts)
            throw new global_error_handling_1.AppError("user not found", 404);
        return res.status(200).json({
            message: "User profile fetched successfully",
            data: userWithPosts
        });
    };
    getUser = async (userId) => {
        return await this._userModel.findOne({
            filter: {
                _id: userId
            }
        });
    };
    getUsers = async () => {
        return await this._userModel.find({ filter: {} });
    };
}
exports.default = new UserService();
