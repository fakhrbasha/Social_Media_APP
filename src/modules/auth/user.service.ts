import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/utils/global-error-handling";
import userModel, { IUser } from "../../DB/models/user.model";
import { HydratedDocument, Model, Types } from "mongoose";
import UserRepository from "../../DB/repository/user.repository";
import { encrypt } from "../../common/utils/security/encrypt";
import { Compare, Hash } from "../../common/utils/security/hash";
import { sendEmail, sendOtp } from "../../common/utils/mail/mail";
import { templateEmail } from "../../common/utils/mail/email.template";
import { EmailEnum, providerEnum, RoleEnum } from "../../common/enum/user.enum";
import { ACCESS_SECRET_KEY_ADMIN, ACCESS_SECRET_KEY_USER, CLIENT_ID, REFRESH_SECRET_KEY_ADMIN, REFRESH_SECRET_KEY_USER } from "../../config/config.service";
import { OAuth2Client } from "google-auth-library";
import RedisService from "../../common/services/redis.service";
import { randomUUID } from "node:crypto"
import TokenService from "../../common/utils/jwt/jwt.service"
import { ISignUpType } from "./auth.dto";
import { eventEmitter } from "../../common/utils/mail/email.event";
import { S3Service } from "../../common/services/s3.service";
import { Store_Enum } from "../../common/enum/multer.enum";
import NotificationServiceConfig from "../../common/services/notification.service";
import { users } from "./graphql/user.type";
class UserService {

    // private readonly _userModel: Model<IUser> = userModel
    // use repository pattern to make the code more maintainable and testable, so that we can easily switch to another database or ORM in the future without changing the business logic of the application.
    // private readonly _userModel = new BaseRepository<IUser>(userModel)
    private readonly _userModel = new UserRepository()
    private readonly _tokenService = TokenService
    private readonly _redisService = RedisService
    private readonly _s3Service = new S3Service()
    private readonly _notificationServiceConfig = NotificationServiceConfig





    constructor() { }

    sendEmailOtp = async ({ email, subject }: { email: string, subject: EmailEnum }) => {
        const isBlocked = await this._redisService.ttl({ key: this._redisService.block_otp_key({ email }) })
        if (isBlocked && isBlocked > 0) {
            throw new AppError(`you have exceeded the maximum number of attempts to resend otp please try again later after ${isBlocked} seconds`, 429)
        }
        const otpTTl = await this._redisService.ttl({ key: this._redisService.otpKey({ email, subject }) })
        if (otpTTl && otpTTl > 0) {
            throw new AppError(`you have already sent otp please check your email or try again later after ${otpTTl} seconds`, 429)
        }
        const maxOtp = await this._redisService.get({ key: this._redisService.max_otp_key({ email }) })
        if (maxOtp && maxOtp >= 3) {
            await this._redisService.setValue({ key: this._redisService.block_otp_key({ email }), value: "blocked", ttl: 60 * 5 })
            throw new AppError(`you have exceeded the maximum number of attempts to resend otp please try again later after 300 seconds`, 429)
        }
        const otp = await sendOtp()
        eventEmitter.emit(EmailEnum.confirmedEmail, async () => {
            await sendEmail({
                to: email,
                subject: "Social-media App",
                html: templateEmail(otp)
            })
        })

        await this._redisService.setValue({ key: this._redisService.otpKey({ email }), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 10 })
        await this._redisService.increment({ key: email })



    }
    signup = async (req: Request, res: Response, next: NextFunction) => {
        const { username, email, password, confirmPassword, age, gender, address, phone, confirmed = false, provider = providerEnum.system }: ISignUpType = req.body; // we can use the ISignUp interface to type the request body, so that we can get type checking and autocompletion for the properties of the request body.
        // HydratedDocument mean  : that the document is a mongoose document that has been hydrated with the data from the database, so that we can use the methods and properties of the mongoose document on it.

        const emailExist = await this._userModel.findOne({ filter: { email } })

        if (emailExist) {
            return next(new AppError("Email already exists", 409))
        }
        const otp = await sendOtp()

        eventEmitter.emit(EmailEnum.confirmedEmail, async () => {
            await sendEmail({
                to: email,
                subject: "Email confirmation",
                html: templateEmail(otp)
            })
            await this._redisService.setValue({ key: this._redisService.otpKey({ email, subject: EmailEnum.confirmedEmail }), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 5 })
            await this._redisService.setValue({ key: this._redisService.max_otp_key({ email }), value: "1", ttl: 60 * 30 })
        })
        const user: HydratedDocument<IUser> = await this._userModel.create({
            username
            , email
            , password: Hash({ plan_text: password })
            , age
            , gender
            , address
            , phone: phone ? encrypt(phone) : undefined,
            confirmed,
            provider
        })

        res.status(200).json({
            message: "User signed up successfully", data: user
        })
    }
    confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
        const { email, otp } = req.body;

        const otpValue = await this._redisService.get({
            key: this._redisService.otpKey({ email, subject: EmailEnum.confirmedEmail })
        });

        if (!otpValue) {
            return next(new AppError("OTP expired", 400));
        }

        if (!Compare({ plan_text: otp, cipher_text: otpValue })) {
            return next(new AppError("Invalid OTP", 400));
        }
        const user = await this._userModel.findOne({
            filter: { email }
        });
        if (!user) {
            return next(new AppError("User not found", 404));
        }
        const userUpdated = await this._userModel.update({ email }, { confirmed: true });

        await this._redisService.del({
            key: this._redisService.otpKey({ email, subject: EmailEnum.confirmedEmail })
        });

        res.status(200).json({
            message: "Email confirmed successfully",
            data: userUpdated
        });
    }
    signin = async (req: Request, res: Response, next: NextFunction) => {
        // const { email, password, fcm } = req.body;
        const { email, password, fcm } = req.body;

        const user = await this._userModel.findOne({ filter: { email } });

        if (!user) {
            return next(new AppError("Invalid email or password", 400));
        }

        if (!Compare({ plan_text: password, cipher_text: user.password })) {
            return next(new AppError("Invalid email or password", 400));
        }
        const uuid = randomUUID()
        const access_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user?.role == RoleEnum.user ? ACCESS_SECRET_KEY_USER : ACCESS_SECRET_KEY_ADMIN,
            options: { jwtid: uuid }
        });
        const refresh_token = this._tokenService.generateToken({
            payload: { id: user._id, email: user.email },
            secretKey: user?.role == RoleEnum.user ? REFRESH_SECRET_KEY_USER : REFRESH_SECRET_KEY_ADMIN,
            options: { jwtid: uuid }
        })

        if (fcm) {
            await this._redisService.addFCM({ userId: user._id, FCMToken: fcm })
            const tokens = await this._redisService.getFCMs(user._id)

            await this._notificationServiceConfig.sendNotifications({
                tokens,
                data: { title: `hi ${user.username}`, body: `new login at ${new Date().toLocaleString()}` }
            })

        }

        return res.status(200).json({
            message: "User signed in successfully",
            data: { access_token, refresh_token }
        });

    }
    reSendOtp = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body
        const userExist = await this._userModel.findOne({ filter: { email } })
        if (!userExist) {
            throw new AppError("user Not Fount", 400)
        }
        await this.sendEmailOtp({ email, subject: EmailEnum.confirmedEmail })

        return res.status(200).json({ message: "message otp send successfully" })

    }
    signinWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
        const { idToken } = req.body;
        const client = new OAuth2Client();
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new AppError("Invalid Google token", 401);
            }
            const { name, email, email_verified, picture } = payload;
            let user = await this._userModel.findOne({ filter: { email } });
            if (!user) {
                user = await this._userModel.create({
                    email,
                    username: name,
                    confirmed: email_verified,
                    pictures: picture ? [picture] : undefined,
                    provider: providerEnum.google,
                });
            }
            if (user.provider === providerEnum.system) {
                throw new AppError("Please login with email and password", 400);
            }
            const access_token = this._tokenService.generateToken({
                payload: { id: user._id },
                secretKey: ACCESS_SECRET_KEY_USER,
            });
            console.log(payload)
            return res.status(201).json({
                message: "User signed in with Google successfully",
                data: { access_token, user },
            });
        } catch (error) {
            next(error);
        }
    };
    // forget password
    forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body

        const user = await this._userModel.findOne({ filter: { email } });

        if (!user) {
            return next(new AppError("User not found", 404));
        }
        const otp = await sendOtp()
        await sendEmail({
            to: email,
            subject: "Reset password OTP",
            html: templateEmail(otp)
        })
        await this._redisService.setValue({ key: this._redisService.otpKey({ email, subject: EmailEnum.forgetPassword }), value: Hash({ plan_text: `${otp}` }), ttl: 60 * 5 })
        res.status(200).json({
            message: "OTP sent to email successfully"
        })
    }
    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const { newPassword, email, otp } = req.body
        const otpValue = await this._redisService.get({
            key: this._redisService.otpKey({ email, subject: EmailEnum.forgetPassword })
        });
        if (!otpValue) {
            return next(new AppError("OTP expired", 400));
        }
        if (!Compare({ plan_text: otp, cipher_text: otpValue })) {
            return next(new AppError("Invalid OTP", 400));
        }
        const user = await this._userModel.findOne({
            filter: { email }
        });
        if (!user) {
            return next(new AppError("User not found", 404));
        }
        const hashedPassword = Hash({ plan_text: newPassword });
        await this._userModel.update({ email }, { password: hashedPassword });
        await this._redisService.del({
            key: this._redisService.otpKey({ email, subject: EmailEnum.forgetPassword })
        });
        res.status(200).json({
            message: "Password reset successfully"
        });
    }
    //  update password 
    updatePassword = async (req: Request, res: Response, next: NextFunction) => {
        const { oldPassword, newPassword } = req.body;
        // console.log("oldPassword:", oldPassword);
        // console.log("hashed in DB:", req.user!.password);
        if (!Compare({ plan_text: oldPassword, cipher_text: req.user!.password })) {
            return next(new AppError("Invalid old password", 400));
        }

        const hashedPassword = Hash({ plan_text: newPassword });
        req.user!.password = hashedPassword;
        await req.user!.save();
        res.status(200).json({
            message: "Password updated successfully"
        });
    }
    // logout 
    logOut = async (req: Request, res: Response, next: NextFunction) => {
        // to log out the user we can just delete the token from the client side, but if we want to invalidate the token we can use redis to store the invalid tokens and check them in the authentication middleware, so that we can prevent the user from using the invalid token to access the protected routes.
        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            await this._redisService.setValue({ key: token, value: "invalid", ttl: 60 * 60 }) // we can set the ttl to the remaining time of the token, so that we can automatically delete the invalid token from redis after it expires.
        }
        res.status(200).json({
            message: "User logged out successfully"
        });

    }
    uploadImage = async (req: Request, res: Response, next: NextFunction) => {

        const image = await this._s3Service.uploadFile({ file: req.file!, path: "users" })


        return res.status(200).json({
            message: "Image uploaded successfully",
            data: image
        })
    }
    uploadLargeFile = async (req: Request, res: Response, next: NextFunction) => {

        const file = await this._s3Service.uploadLargeFile({ file: req.file!, path: "users/large" })


        return res.status(200).json({
            message: "File uploaded successfully",
            data: file
        })
    }
    uploadFiles = async (req: Request, res: Response, next: NextFunction) => {
        const files = await this._s3Service.uploadFiles({ files: req.files as Express.Multer.File[], path: "users/multiple", isLarge: false })



        return res.status(200).json({
            message: "Files uploaded successfully",
            data: files
        })
    }
    // method must put
    uploadFileWithoutMulter = async (req: Request, res: Response, next: NextFunction) => {
        const { fileName, ContentType } = req.body
        const { url, Key } = await this._s3Service.createPreSignedUrl({ path: "users", fileName, ContentType })

        return res.status(201).json({ message: "done", data: { url, Key } })
    }

    getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
        const user = await this._userModel.findOne({
            filter: { _id: req.user._id }
        })
        if (!user)
            throw new AppError("user not found", 404)
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
        })
        if (!userWithPosts)
            throw new AppError("user not found", 404)
        return res.status(200).json({
            message: "User profile fetched successfully",
            data: userWithPosts
        })
    }

    // -------------------- graph-QL -----------------------//
    getUser = async (userId: Types.ObjectId) => {
        return await this._userModel.findOne({
            filter: {
                _id: userId
            }
        })
    }
    getUsers = async () => {
        return await this._userModel.find({ filter: {} })
    }

}

export default new UserService();