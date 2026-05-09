"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = require("fs");
const path_1 = require("path");
class NotificationServiceConfig {
    client;
    constructor() {
        var serviceAccount = JSON.parse((0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, "../../config/social-app-4f78c-firebase-adminsdk-fbsvc-c8b694f5e0.json")));
        this.client = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount)
        });
    }
    async sendNotification({ token, data }) {
        const message = {
            token,
            data
        };
        return await this.client.messaging().send(message);
    }
    async sendNotifications({ tokens, data }) {
        const message = {
            tokens,
            data
        };
        return await this.client.messaging().sendEachForMulticast(message);
    }
}
exports.default = new NotificationServiceConfig();
