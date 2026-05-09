"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteKey = exports.update = exports.getValue = exports.setValue = exports.otpKey = void 0;
const user_enum_1 = require("../../enum/user.enum");
const redis_db_1 = require("./redis.db");
const otpKey = (email, subject = user_enum_1.emailEnum.confirmedEmail) => {
    return `otp::${email}::${subject}`;
};
exports.otpKey = otpKey;
const setValue = async ({ key, value, ttl }) => {
    try {
        if (!key)
            throw new Error("Redis key is required");
        if (value === undefined)
            throw new Error("Redis value is undefined");
        const data = typeof value === 'string'
            ? value
            : JSON.stringify(value);
        return ttl
            ? await redis_db_1.redisClient.setEx(key, ttl, data)
            : await redis_db_1.redisClient.set(key, data);
    }
    catch (error) {
        console.error("Error setting value in Redis:", error);
        throw error;
    }
};
exports.setValue = setValue;
const getValue = async ({ key }) => {
    try {
        const value = await redis_db_1.redisClient.get(key);
        try {
            return value ? JSON.parse(value) : null;
        }
        catch {
            return value;
        }
    }
    catch (error) {
        console.error("Error getting value from Redis:", error);
        throw error;
    }
};
exports.getValue = getValue;
const update = async ({ key, value, ttl }) => {
    try {
        if (!(await redis_db_1.redisClient.exists(key))) {
            return 0;
        }
        return await (0, exports.setValue)({ key, value, ttl });
    }
    catch (error) {
        console.log("error to update data in redis", error);
    }
};
exports.update = update;
const deleteKey = async ({ key }) => {
    try {
        if (!key.length)
            return 0;
        return await redis_db_1.redisClient.del(key);
    }
    catch (error) {
        console.error("Error deleting key from Redis:", error);
        throw error;
    }
};
exports.deleteKey = deleteKey;
