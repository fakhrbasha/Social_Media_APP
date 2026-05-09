"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_service_1 = __importDefault(require("./notification.service"));
const notificationRouter = (0, express_1.Router)();
notificationRouter.post('/send-notification', notification_service_1.default.sendNotification);
exports.default = notificationRouter;
