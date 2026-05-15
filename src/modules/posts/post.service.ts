import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/utils/global-error-handling";
import userModel, { IUser } from "../../DB/models/user.model";
import { HydratedDocument, Model, Types } from "mongoose";
import UserRepository from "../../DB/repository/user.repository";

import RedisService from "../../common/services/redis.service";
import TokenService from "../../common/utils/jwt/jwt.service"

import { S3Service } from "../../common/services/s3.service";

import NotificationServiceConfig from "../../common/services/notification.service";
import { ICreatePostDTO } from "./post.dto";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import PostRepository from "../../DB/repository/post.repository";
import fi from "zod/v4/locales/fi.js";
import { AvailabilityEnum } from "../../common/enum/postEnum";
import { PostAvailability } from "../../common/utils/post.utils";
import { match } from "node:assert";
import { populate } from "dotenv";
import path from "node:path";
class postService {


    private readonly _userModel = new UserRepository()
    private readonly _postModel = new PostRepository()
    private readonly _tokenService = TokenService
    private readonly _redisService = RedisService
    private readonly _s3Service = new S3Service()
    private readonly _notificationServiceConfig = NotificationServiceConfig





    constructor() { }


    createPost = async (req: Request, res: Response, next: NextFunction) => {
        const { allowComment, availability, content, tags }: ICreatePostDTO = req.body

        let mentions: Types.ObjectId[] = []
        let fcmTokens: string[] = []
        if (tags?.length) {
            const mentionTags = await this._userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            })
            if (mentionTags.length !== tags.length) {
                throw new AppError("some of the tags are not valid", 400)
            }
            for (const tag of mentionTags) {
                mentions.push(tag._id);
                // to send notification
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token))
            }
        }
        let urls: string[] = []
        let folderId = randomUUID()
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${req.user._id}/posts/${folderId}`,
                store_type: Store_Enum.memory
            })
        }
        const post = await this._postModel.create({
            attachments: urls,
            content,
            createdBy: req.user._id,
            tags: mentions,
            folderId,
            availability,
            allowComments: allowComment
        })
        if (!post) {
            await this._s3Service.deleteFiles(urls) // if the post creation failed we will delete the uploaded files from s3 to avoid having orphan files in s3 that are not associated with any post in the database, and to save storage space and reduce costs.
            throw new AppError("Failed to create post", 500)
        }
        if (fcmTokens?.length) {
            await this._notificationServiceConfig.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "You are mentioned in a post",
                    body: `${req.user.firstName} mentioned you in a post`,
                }
            })
        }
        return res.status(201).json({
            status: "success",
            message: "Post created successfully",
            data: {
                post
            }
        })
    }

    getPosts = async (req: Request, res: Response, next: NextFunction) => {

        const searchQuery = req.query?.search ? { content: { $regex: req.query.search, $options: "i" } } : {}


        const posts = await this._postModel.paginate({
            page: +req.query?.page!,
            limit: +req.query?.limit!,
            search: {
                $or: [
                    ...PostAvailability(req)
                ],
                ...searchQuery
            },
            // mongoose stream virtual populate to get post comments when get posts
            populate: {
                path: "comments",
                match: {
                    commentId: { $exists: false }
                },
                populate: [{
                    path: "replies",
                }]

            }
        })

        return res.status(200).json({
            status: "success",
            message: "Posts retrieved successfully",
            data: {
                posts
            }
        })
        // filter: {
        //     $or: [
        //         { availability: AvailabilityEnum.public },
        //         { availability: AvailabilityEnum.private, createdBy: req.user._id },
        //         { availability: AvailabilityEnum.friends, createdBy: { $in: [...req.user?.friends || [], req.user._id] } },
        //         { tags: req.user._id }
        //     ]
        // }
    }
    getMyPosts = async (req: Request, res: Response, next: NextFunction) => {
        const posts = await this._postModel.find({
            filter: {
                createdBy: req.user._id
            },
            // to get post comments when get my posts
            options: {
                populate: {
                    path: "comments",
                }
            }
        })
        return res.status(200).json({
            status: "success",
            message: "Posts retrieved successfully",
            data: {
                posts
            }
        })

    }
    getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
        const posts = await this._postModel.find({
            filter: {}
        })
        return res.status(200).json({
            status: "success",
            message: "Posts retrieved successfully",
            data: {
                posts
            }
        })
    }
    getPostById = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const post = await this._postModel.findOne({ filter: { _id: id } })
        if (!post) {
            throw new AppError("Post not found", 404)
        }
        return res.status(200).json({
            status: "success",
            message: "Post retrieved successfully",
            data: {
                post
            }
        })
    }
    deletePost = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const post = await this._postModel.findOne({ filter: { _id: id } })
        if (!post) {
            throw new AppError("Post not found", 404)
        }
        if (post.createdBy.toString() !== req.user._id.toString()) {
            throw new AppError("You are not authorized to delete this post", 403)
        }
        await this._postModel.findOneAndDelete(post._id)
        if (post.attachments?.length) {
            await this._s3Service.deleteFiles(post.attachments)
        }
        return res.status(200).json({
            status: "success",
            message: "Post deleted successfully",
        })

    }
    updatePost = async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params
        const { allowComment, availability, content, tags }: ICreatePostDTO = req.body

        let mentions: Types.ObjectId[] = []
        let fcmTokens: string[] = []
        if (tags?.length) {
            const mentionTags = await this._userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            })
            if (mentionTags.length !== tags.length) {
                throw new AppError("some of the tags are not valid", 400)
            }
            for (const tag of mentionTags) {
                mentions.push(tag._id);
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token))
            }
        }
        let urls: string[] = []
        let folderId = randomUUID()
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${req.user._id}/posts/${folderId}`,
                store_type: Store_Enum.memory
            })
        }
        const post = await this._postModel.update({ _id: id }, { attachments: urls, content, tags: mentions, availability, allowComments: allowComment })
        if (!post) {
            await this._s3Service.deleteFiles(urls) // if the post update failed we will delete the uploaded files from s3 to avoid having orphan files in s3 that are not associated with any post in the database, and to save storage space and reduce costs.
            throw new AppError("Failed to update post", 500)
        }
        if (fcmTokens?.length) {
            await this._notificationServiceConfig.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "You are mentioned in a post",
                    body: `${req.user.firstName} mentioned you in a post`,
                }
            })
        }
        return res.status(200).json({
            status: "success",
            message: "Post updated successfully",
            data: {
                post
            }
        })
    }
    LikeOrUnlikePost = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const { postId } = req.params;
        const { flag } = req.query;

        if (Array.isArray(postId)) {
            throw new AppError("Invalid post Id", 400);
        }

        let updateQuery: any = {
            $addToSet: { likes: req.user._id }
        };

        if (flag === "disLike") {
            updateQuery = {
                $pull: { likes: req.user._id }
            };
        }

        const post = await this._postModel.findOneAndUpdate({
            filter: {
                id: postId,
                ...PostAvailability(req)
            },
            update: updateQuery,
            options: {
                new: true,
            }
        });
        if (!post) {
            throw new AppError("Post not found", 404)
        }
        return res.status(200).json({
            message: "Done",
            post
        });
    };




}

export default new postService();