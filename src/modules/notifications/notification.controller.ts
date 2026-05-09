import { Router } from "express";
import notificationService from "./notification.service";

const notificationRouter = Router();

notificationRouter.post('/send-notification', notificationService.sendNotification)

export default notificationRouter;