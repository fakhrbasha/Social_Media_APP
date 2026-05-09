"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_service_1 = require("../../config/config.service");
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../enum/multer.enum");
const fs = __importStar(require("node:fs"));
const global_error_handling_1 = require("../utils/global-error-handling");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_service_1.AWS_REGION,
            credentials: {
                accessKeyId: config_service_1.AWS_ACCESS_KEY,
                secretAccessKey: config_service_1.AWS_SECRUT_ACCESS_KEY
            }
        });
    }
    async uploadFile({ ACL = client_s3_1.ObjectCannedACL.private, store_type = multer_enum_1.Store_Enum.memory, path = "General", file }) {
        const commend = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            ACL,
            Key: `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
            Body: store_type == multer_enum_1.Store_Enum.memory ? file.buffer : fs.createReadStream(file.path),
            ContentType: file.mimetype
        });
        console.log("commend ", commend);
        if (!commend.input.Key) {
            throw new global_error_handling_1.AppError("Failed to upload file");
        }
        await this.client.send(commend);
        return commend.input.Key;
    }
    async uploadLargeFile({ ACL = client_s3_1.ObjectCannedACL.private, store_type = multer_enum_1.Store_Enum.disk, path = "General", file }) {
        const upload = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket: config_service_1.AWS_BUCKET_NAME,
                ACL,
                Key: `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                Body: store_type == multer_enum_1.Store_Enum.memory ? file.buffer : fs.createReadStream(file.path),
                ContentType: file.mimetype
            }
        });
        console.log("uploading ", upload);
        upload.on("httpUploadProgress", (progress) => {
            console.log(progress);
        });
        const result = await upload.done();
        if (!result.Key) {
            throw new global_error_handling_1.AppError("Failed to upload file");
        }
        return result.Key;
    }
    async uploadFiles({ ACL = client_s3_1.ObjectCannedACL.private, store_type = multer_enum_1.Store_Enum.memory, path = "General", files, isLarge = false }) {
        let url = [];
        if (isLarge) {
            url = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({ ACL, store_type, path, file });
            }));
        }
        else {
            url = await Promise.all(files.map((file) => {
                return this.uploadFile({ ACL, store_type, path, file });
            }));
        }
        return url;
    }
    async createPreSignedUrl({ path, fileName, ContentType, expiresIn = 60 }) {
        const Key = `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
            ContentType
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, Key };
    }
    async getFile(Key) {
        const commend = new client_s3_1.GetObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key
        });
        return this.client.send(commend);
    }
    async getPreSignedUrl({ Key, expireIn, download }) {
        const commend = new client_s3_1.GetObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Key,
            ResponseContentDisposition: download ? `attachment; filename="${Key.split("/").pop()}"` : undefined
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, commend, { expiresIn: expireIn || 60 });
        return url;
    }
    async getFiles(folderName) {
        const commend = new client_s3_1.ListObjectsCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Prefix: `social_media_app/${folderName}/`
        });
        return await this.client.send(commend);
    }
    async deleteFiles(keys) {
        const deleteParams = {
            Bucket: config_service_1.AWS_BUCKET_NAME,
            Delete: {
                Objects: keys.map((key) => ({ Key: key }))
            }
        };
        const command = new client_s3_1.DeleteObjectsCommand(deleteParams);
        return await this.client.send(command);
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
