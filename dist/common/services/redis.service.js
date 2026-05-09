"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
const user_enum_1 = require("../enum/user.enum");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_service_1.REDIS_URL
        });
        this.handleEvent();
    }
    async connect() {
        this.client.connect();
        console.log("Connected to Redis Successfully");
    }
    handleEvent() {
        this.client.on("error", (err) => {
            console.error("Redis Client Error", err);
        });
    }
    revoke_keys = ({ userid, jti }) => {
        return `revoke_token::${userid}::${jti}`;
    };
    get_key = ({ userId }) => {
        return `revoke_token::${userId}`;
    };
    otpKey = ({ email, subject = user_enum_1.EmailEnum.confirmedEmail }) => {
        return `otp::${email}::${subject}`;
    };
    max_otp_key = ({ email }) => {
        return `${this.otpKey({ email })}::max`;
    };
    block_otp_key = ({ email }) => {
        return `${this.otpKey({ email })}::block`;
    };
    forgetPass = ({ email }) => {
        return `forget_password_otp::${email}`;
    };
    loginFail = ({ email }) => {
        return `login_fail::${email}`;
    };
    loginBlock = ({ email }) => {
        return `login_block::${email}`;
    };
    twoFaKey = ({ email }) => {
        return `2fa:${email}`;
    };
    loginOtp = ({ email }) => {
        return `login_otp:${email}`;
    };
    increment = async ({ key }) => {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.log("error increment redis", error);
        }
    };
    setValue = async ({ key, value, ttl }) => {
        try {
            const data = typeof value === 'string' ? value : JSON.stringify(value);
            return ttl ? await this.client.setEx(key, ttl, data) : await this.client.set(key, data);
        }
        catch (error) {
            console.log("error to set data in redis", error);
        }
    };
    update = async ({ key, value, ttl }) => {
        try {
            if (!await this.client.exists(key)) {
                return 0;
            }
            return await this.setValue({ key, value, ttl });
        }
        catch (error) {
            console.log("error to update data in redis", error);
        }
    };
    get = async ({ key }) => {
        try {
            const data = await this.client.get(key);
            if (!data)
                return null;
            try {
                return JSON.parse(data);
            }
            catch {
                return data;
            }
        }
        catch (error) {
            console.log("error to get data from redis", error);
        }
    };
    ttl = async ({ key }) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.log("error to set ttl for data in redis", error);
        }
    };
    del = async ({ key }) => {
        try {
            if (!key.length)
                return 0;
            return await this.client.del(key);
        }
        catch (error) {
            console.log("error to delete data from redis", error);
        }
    };
    Keys = async ({ pattern }) => {
        try {
            return await this.client.keys(`${pattern}*`);
        }
        catch (error) {
            console.log("error to get keys from redis", error);
        }
    };
    exists = async ({ key }) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log("error to check if key exists in redis", error);
        }
    };
    expire = async ({ key, ttl }) => {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            console.log("error to set ttl for data in redis", error);
        }
    };
    key(userId) {
        return `user:FCM:${userId}`;
    }
    addFCM({ userId, FCMToken }) {
        return this.client.sAdd(this.key(userId), FCMToken);
    }
    removeFCM({ userId, FCMToken }) {
        return this.client.sRem(this.key(userId), FCMToken);
    }
    getFCMs(userId) {
        return this.client.sMembers(this.key(userId));
    }
    hasFCM({ userId }) {
        return this.client.sCard(this.key(userId));
    }
    removeFCMUser(userId) {
        return this.client.del(this.key(userId));
    }
}
exports.default = new RedisService();
