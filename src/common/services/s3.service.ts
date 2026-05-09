import { DeleteObjectsCommand, GetObjectAclCommand, GetObjectCommand, ListObjectsCommand, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRUT_ACCESS_KEY } from "../../config/config.service";

import { randomUUID } from "node:crypto"
import { Store_Enum } from "../enum/multer.enum";
import * as fs from "node:fs";
import { AppError } from "../utils/global-error-handling";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export class S3Service {

    private client: S3Client




    constructor() {
        this.client = new S3Client({

            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY,
                secretAccessKey: AWS_SECRUT_ACCESS_KEY
            }
        })

    }

    async uploadFile(
        {
            ACL = ObjectCannedACL.private,
            store_type = Store_Enum.memory,
            path = "General",
            file
        }
            :
            {
                store_type?: Store_Enum,
                ACL?: ObjectCannedACL,
                path?: string,
                file: Express.Multer.File

            }): Promise<string> {
        const commend = new PutObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            ACL,
            Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,// path file you upload it
            Body: store_type == Store_Enum.memory ? file.buffer : fs.createReadStream(file.path),
            ContentType: file.mimetype

        })
        console.log("commend ", commend)
        if (!commend.input.Key) {
            throw new AppError("Failed to upload file")
        }
        await this.client.send(commend)
        return commend.input.Key
    }
    // to upload large file npm i @aws-sdk/lib-storage
    async uploadLargeFile(
        {
            ACL = ObjectCannedACL.private,
            store_type = Store_Enum.disk,
            path = "General",
            file
        }
            :
            {
                store_type?: Store_Enum,
                ACL?: ObjectCannedACL,
                path?: string,
                file: Express.Multer.File

            }): Promise<string> {
        const upload = new Upload({
            client: this.client,
            params: {
                Bucket: AWS_BUCKET_NAME,
                ACL,
                Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,// path file you upload it
                Body: store_type == Store_Enum.memory ? file.buffer : fs.createReadStream(file.path),
                ContentType: file.mimetype
            }

        })



        console.log("uploading ", upload)

        upload.on("httpUploadProgress", (progress) => {
            console.log(progress) // .... 80% ..
        })

        const result = await upload.done()
        if (!result.Key) {
            throw new AppError("Failed to upload file")
        }

        return result.Key
    }

    // upload files

    async uploadFiles({
        ACL = ObjectCannedACL.private,
        store_type = Store_Enum.memory,
        path = "General",
        files,
        isLarge = false
    }: {
        store_type?: Store_Enum,
        ACL?: ObjectCannedACL,
        path?: string,
        files: Express.Multer.File[],
        isLarge?: boolean

    }) {
        let url: string[] = []

        if (isLarge) {
            url = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({ ACL, store_type, path, file })
            }))
        } else {
            url = await Promise.all(files.map((file) => {
                return this.uploadFile({ ACL, store_type, path, file })
            }))
        }
        return url

    }

    // another way to upload photo without multer 
    // this way create url and key click url and select binary and upload photo
    async createPreSignedUrl({ path, fileName, ContentType, expiresIn = 60 }: { path: string, fileName: string, ContentType: string, expiresIn?: number }) {

        const Key = `social_media_app/${path}/${randomUUID()}__${fileName}`
        const command = new PutObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key,
            ContentType

        })
        const url = await getSignedUrl(this.client, command, { expiresIn })

        return { url, Key }
    }


    async getFile(Key: string) {
        const commend = new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key
        })

        return this.client.send(commend)
    }

    async getPreSignedUrl({ Key, expireIn, download }: { Key: string, expireIn?: number, download?: string }) {
        const commend = new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key,
            // for download 
            ResponseContentDisposition: download ? `attachment; filename="${Key.split("/").pop()}"` : undefined
        })
        const url = await getSignedUrl(this.client, commend, { expiresIn: expireIn || 60 })
        return url
    }

    async getFiles(folderName: string) {
        const commend = new ListObjectsCommand({
            Bucket: AWS_BUCKET_NAME,
            Prefix: `social_media_app/${folderName}/`
        })
        return await this.client.send(commend)
    }

    async deleteFiles(keys: string[]) {
        const deleteParams = {
            Bucket: AWS_BUCKET_NAME,
            Delete: {
                Objects: keys.map((key) => ({ Key: key }))
            }
        }
        const command = new DeleteObjectsCommand(deleteParams)
        return await this.client.send(command)
    }
}
export const s3Service = new S3Service()
