import { compareSync, hashSync } from "bcrypt";
import { SALT_ROUND } from "../../../config/config.service";

export function Hash({ plan_text, salt_round = SALT_ROUND }: {
    plan_text: string,
    salt_round?: number
}): string {
    if (!plan_text) {
        throw new Error("Plan text is required for hashing");
    }
    return hashSync(plan_text.toString(), Number(salt_round))
}
export function Compare({ plan_text, cipher_text }: {
    plan_text: string,
    cipher_text: string
}): boolean {
    if (!plan_text || !cipher_text) {
        throw new Error("Both plan text and cipher text are required for comparison");
    }
    return compareSync(plan_text, cipher_text)
}