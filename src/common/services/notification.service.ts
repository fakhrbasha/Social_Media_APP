
import admin from 'firebase-admin'

import { readFileSync } from 'fs'
import { resolve } from 'path'

class NotificationServiceConfig {

    private readonly client: admin.app.App

    constructor() {

        var serviceAccount = JSON.parse(readFileSync(resolve(__dirname, "../../config/social-app-4f78c-firebase-adminsdk-fbsvc-c8b694f5e0.json")) as unknown as string)

        this.client = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    // now you need fcm token of the device you want to send notification to and then you can call this function
    async sendNotification({ token, data }: { token: string, data: { title: string, body: string } }) {

        const message = {
            token,
            data
        }
        return await this.client.messaging().send(message)
    }
    async sendNotifications({ tokens, data }: { tokens: string[], data: { title: string, body: string } }) {

        const message = {
            tokens,
            data
        }
        return await this.client.messaging().sendEachForMulticast(message)
        // await Promise.all(tokens.map(token => {
        //     return this.sendNotification({ token, data })
        // }))
    }
}

export default new NotificationServiceConfig()