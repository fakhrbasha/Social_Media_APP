import { EventEmitter } from "node:events";
import { EmailEnum } from "../../enum/user.enum";

export const eventEmitter = new EventEmitter()

eventEmitter.on(EmailEnum.confirmedEmail, async (fn) => {
    await fn()
})