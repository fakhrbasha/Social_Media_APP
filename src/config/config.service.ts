import { resolve } from "path";

import { config } from "dotenv";
const NODE_ENV = process.env.NODE_ENV; // development 0r production
config({ path: resolve(__dirname, `../../.env.${NODE_ENV}`) });


export const PORT: number = Number(process.env.PORT)
export const MONGO_URI: string = process.env.MONGO_URI!; // the ! is used to tell TypeScript that we are sure that this variable will not be undefined, because we have already checked it in the checkEnvVariables function in the src/app.ts file, so we can use it without checking it again in the src/DB/connectionDB.ts file.
export const SALT_ROUND: number = Number(process.env.SALT_ROUND)
export const ENCRYPTION_KEY: string = process.env.ENCRYPTION_KEY!
export const GMAIL_USER: string = process.env.GMAIL_USER!
export const GMAIL_PASS: string = process.env.GMAIL_PASS!

export const ACCESS_SECRET_KEY_USER: string = process.env.ACCESS_SECRET_KEY_USER!
export const ACCESS_SECRET_KEY_ADMIN: string = process.env.ACCESS_SECRET_KEY_ADMIN!

export const REFRESH_SECRET_KEY_USER: string = process.env.REFRESH_SECRET_KEY_USER!
export const REFRESH_SECRET_KEY_ADMIN: string = process.env.REFRESH_SECRET_KEY_ADMIN!

export const PREFIX_USER: string = process.env.PREFIX_USER!
export const PREFIX_ADMIN: string = process.env.PREFIX_ADMIN!
export const REDIS_URL: string = process.env.REDIS_URL!


export const CLIENT_ID = process.env.CLIENT_ID

export const AWS_REGION = process.env.AWS_REGION!
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME!
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY!
export const AWS_SECRUT_ACCESS_KEY = process.env.AWS_SECRUT_ACCESS_KEY!
