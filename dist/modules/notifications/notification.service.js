"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_service_1 = __importDefault(require("../../common/services/notification.service"));
class NotificationService {
    _notificationService = notification_service_1.default;
    async sendNotification(req, res) {
        await this._notificationService.sendNotification({
            token: req.body.token,
            data: {
                title: "welcome to social app",
                body: "this is a test notification from social app api"
            }
        });
    }
}
exports.default = new NotificationService();
