import { Request, Response } from "express";
import NotificationServiceConfig from "../../common/services/notification.service";



class NotificationService {
    private readonly _notificationService = NotificationServiceConfig

    async sendNotification(req: Request, res: Response) {
        await this._notificationService.sendNotification({
            token: req.body.token,
            data: {
                title: "welcome to social app",
                body: "this is a test notification from social app api"
                // title: req.body.title,
                // body: req.body.body
            }
        })
    }
}

export default new NotificationService()