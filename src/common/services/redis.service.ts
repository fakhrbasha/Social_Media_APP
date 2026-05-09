import { createClient, RedisClientType } from "redis";
import { REDIS_URL } from "../../config/config.service";
import { Types } from "mongoose";
import { EmailEnum } from "../enum/user.enum";


class RedisService {

    private readonly client: RedisClientType
    constructor() {
        this.client = createClient({
            url: REDIS_URL
        });

        this.handleEvent()
    }

    async connect() {
        this.client.connect()
        console.log("Connected to Redis Successfully")
    }
    handleEvent() {
        this.client.on("error", (err) => {
            console.error("Redis Client Error", err);
        });
    }




    revoke_keys = ({ userid, jti }: { userid: Types.ObjectId, jti: string }) => {
        return `revoke_token::${userid}::${jti}`
    }
    get_key = ({ userId }: { userId: Types.ObjectId }) => {
        return `revoke_token::${userId}`
    }

    otpKey = ({ email, subject = EmailEnum.confirmedEmail }: { email: string, subject?: EmailEnum }) => {
        return `otp::${email}::${subject}`
    }

    max_otp_key = ({ email }: { email: string }) => {
        return `${this.otpKey({ email })}::max`
    }
    block_otp_key = ({ email }: { email: string }) => {
        return `${this.otpKey({ email })}::block`
    }
    forgetPass = ({ email }: { email: string }) => {
        return `forget_password_otp::${email}`
    }

    loginFail = ({ email }: { email: string }) => {
        return `login_fail::${email}`
    }
    loginBlock = ({ email }: { email: string }) => {
        return `login_block::${email}`
    }
    twoFaKey = ({ email }: { email: string }) => {
        return `2fa:${email}`
    }
    loginOtp = ({ email }: { email: string }) => {
        return `login_otp:${email}`
    }
    increment = async ({ key }: { key: string }) => {
        try {
            return await this.client.incr(key)
        } catch (error) {
            console.log("error increment redis", error)
        }
    }

    setValue = async ({ key, value, ttl }: { key: string, value: unknown, ttl?: number }) => {
        try {
            const data = typeof value === 'string' ? value : JSON.stringify(value)
            return ttl ? await this.client.setEx(key, ttl, data) : await this.client.set(key, data)
        } catch (error) {
            console.log("error to set data in redis", error);
        }
    }

    update = async ({ key, value, ttl }: { key: string, value: unknown, ttl?: number }) => {
        try {
            if (!await this.client.exists(key)) {
                return 0
            }
            return await this.setValue({ key, value, ttl })
        } catch (error) {
            console.log("error to update data in redis", error);
        }
    }

    get = async ({ key }: { key: string }) => {
        try {
            const data = await this.client.get(key)
            if (!data) return null

            try {
                return JSON.parse(data)
            } catch {
                return data
            }
        } catch (error) {
            console.log("error to get data from redis", error);
        }
    }
    // Mget = async ({key}: { key: string }) => {
    //       try {
    //         const data = await this.client.mGet(key)
    //         if (!data) return null

    //         try {
    //             return JSON.parse(data)
    //         } catch {
    //             return data
    //         }
    //     } catch (error) {
    //         console.log("error to get data from redis", error);
    //     }
    // }
    ttl = async ({ key }: { key: string }) => {
        try {
            return await this.client.ttl(key)
        } catch (error) {
            console.log("error to set ttl for data in redis", error);
        }
    }
    del = async ({ key }: { key: string }) => {
        try {
            if (!key.length) return 0
            return await this.client.del(key)
        } catch (error) {
            console.log("error to delete data from redis", error);
        }
    }

    Keys = async ({ pattern }: { pattern: string }) => {
        try {
            return await this.client.keys(`${pattern}*`)
        } catch (error) {
            console.log("error to get keys from redis", error);
        }
    }
    exists = async ({ key }: { key: string }) => {
        try {
            return await this.client.exists(key)
        } catch (error) {
            console.log("error to check if key exists in redis", error);
        }
    }

    expire = async ({ key, ttl }: { key: string, ttl: number }) => {
        try {
            return await this.client.expire(key, ttl)
        } catch (error) {
            console.log("error to set ttl for data in redis", error);
        }
    }

    key(userId: Types.ObjectId) {
        return `user:FCM:${userId}`
    }
    addFCM({ userId, FCMToken }: { userId: Types.ObjectId, FCMToken: string }) {
        return this.client.sAdd(this.key(userId), FCMToken)
    }
    removeFCM({ userId, FCMToken }: { userId: Types.ObjectId, FCMToken: string }) {
        return this.client.sRem(this.key(userId), FCMToken)
    }
    getFCMs(userId: Types.ObjectId) {
        return this.client.sMembers(this.key(userId))
    }
    hasFCM({ userId }: { userId: Types.ObjectId }) {
        return this.client.sCard(this.key(userId))
    }
    removeFCMUser(userId: Types.ObjectId) {
        return this.client.del(this.key(userId))
    }



}

export default new RedisService()