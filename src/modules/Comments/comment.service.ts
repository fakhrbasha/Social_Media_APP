import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/utils/global-error-handling";
import userModel, { IUser } from "../../DB/models/user.model";
import { HydratedDocument, Model, Types } from "mongoose";
import UserRepository from "../../DB/repository/user.repository";

import RedisService from "../../common/services/redis.service";
import TokenService from "../../common/utils/jwt/jwt.service"

import { S3Service } from "../../common/services/s3.service";

import NotificationServiceConfig from "../../common/services/notification.service";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import PostRepository from "../../DB/repository/post.repository";
import fi from "zod/v4/locales/fi.js";
import { AllowCommentEnum, AvailabilityEnum } from "../../common/enum/postEnum";
import { PostAvailability } from "../../common/utils/post.utils";
import CommentRepository from "../../DB/repository/comment.repository";
import path from "node:path";
class commentService {


    private readonly _userModel = new UserRepository()
    private readonly _postModel = new PostRepository()
    private readonly _tokenService = TokenService
    private readonly _redisService = RedisService
    private readonly _s3Service = new S3Service()
    private readonly _commentModel = new CommentRepository()
    private readonly _notificationServiceConfig = NotificationServiceConfig





    constructor() { }

    createComment = async (req: Request, res: Response, next: NextFunction) => {
        const { content, tags } = req.body
        const { postId } = req.params

        const post = await this._postModel.findOne({
            filter: {
                _id: postId,
                $or: [
                    ...PostAvailability(req)
                ],
                allowComments: AllowCommentEnum.allow
            },

        })
        if (!post) {
            throw new AppError("Post not found or you are not allowed to comment on this post", 404)
        }

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
                path: `users/${req.user._id}/posts/${post.folderId}/comments/${folderId}`,
                store_type: Store_Enum.memory
            })
        }
        const comment = await this._commentModel.create({
            attachments: urls,
            content,
            createdBy: req.user._id,
            tags: mentions,
            folderId,
            postId: post._id
        })
        if (!comment) {
            await this._s3Service.deleteFiles(urls) // if the comment creation failed we will delete the uploaded files from s3 to avoid having orphan files in s3 that are not associated with any comment in the database, and to save storage space and reduce costs.
            throw new AppError("Failed to create comment", 500)
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
            message: "Comment created successfully",
            data: {
                comment
            }
        })
    }


    createReply = async (req: Request, res: Response, next: NextFunction) => {
        const { content, tags } = req.body
        const { postId, commentId } = req.params

        const comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                postId: postId
            },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            $or: [
                                ...PostAvailability(req)
                            ],
                            allowComments: AllowCommentEnum.allow
                        }
                    }
                ]
            }

        })
        if (!comment) {
            throw new AppError("comment not found or you are not allowed to comment on this post", 404)
        }

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
                path: `users/${req.user._id}/posts/${(comment.postId as any).folderId}/comments/${folderId}`,
                store_type: Store_Enum.memory
            })
        }
        const reply = await this._commentModel.create({
            attachments: urls,
            content,
            createdBy: req.user._id,
            tags: mentions,
            folderId,
            postId: comment.postId._id,
            commentId: comment._id
        })
        if (!reply) {
            await this._s3Service.deleteFiles(urls) // if the comment creation failed we will delete the uploaded files from s3 to avoid having orphan files in s3 that are not associated with any comment in the database, and to save storage space and reduce costs.
            throw new AppError("Failed to create reply", 500)
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
            message: "Reply created successfully",
            data: {
                reply
            }
        })
    }

    getAllComments = async (req: Request, res: Response, next: NextFunction) => {
        const { postId } = req.params;

        const comments = await this._commentModel.find({
            filter: {
                postId,
                commentId: { $exists: false }
            },
            options: {
                populate: [
                    {
                        path: "createdBy",
                        select: "firstName lastName"
                    },
                    {
                        path: "replies",
                        populate: {
                            path: "createdBy",
                            select: "firstName lastName"
                        }
                    }
                ]
            }
        });

        return res.status(200).json({
            status: "success",
            message: "Comments fetched successfully",
            data: {
                comments
            }
        });
    };

    likeComment = async (req: Request, res: Response, next: NextFunction) => {
        const { commentId } = req.params
        const { flag } = req.query

        if (Array.isArray(commentId)) {
            throw new AppError("Invalid comment id", 400);
        }

        let updateQuery: any = {
            $addToSet: {
                likes: req.user._id
            }
        }
        if (flag == 'dislike') {
            updateQuery = {
                $pull: { likes: req.user._id }
            };
        }


        const comment = await this._commentModel.findOneAndUpdate({
            filter: {
                _id: commentId,
                ...PostAvailability(req)
            },
            update: updateQuery,
            options: {
                new: true
            }
        })
        if (!comment) {
            throw new AppError("comment not found or you are not allowed to comment on this post", 404)
        }
        return res.status(200).json({
            status: "success",
            message: "Comment liked successfully",
            data: {
                comment
            }
        })


    }

    deleteComment = async (req: Request, res: Response, next: NextFunction) => {
        const { commentId } = req.params as { commentId: string }

        const comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                createdBy: req.user._id,
                ...PostAvailability(req)
            }
        })
        if (!comment) {
            throw new AppError("comment not found or you are not allowed to delete this comment", 404)
        }

        const folderId = (comment as any).folderId
        const postId = (comment.postId as any).folderId

        await this._s3Service.deleteFiles([
            `users/${req.user._id}/posts/${postId}/comments/${folderId}`
        ])
        await this._commentModel.delete(
            new Types.ObjectId(commentId) as Types.ObjectId
        )
        return res.status(200).json({
            status: "success",
            message: "Comment deleted successfully"
        })

    }

    updateComment = async (req: Request, res: Response, next: NextFunction) => {
        const { commentId } = req.params as { commentId: string }
        const { content, tags } = req.body;

        const comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                createdBy: req.user._id,
                ...PostAvailability(req)
            }
        })
        if (!comment) {
            throw new AppError("comment not found or you are not allowed to update this comment", 404)
        }
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
                path: `users/${req.user._id}/posts/${(comment.postId as any).folderId}/comments/${comment.folderId}`,
                store_type: Store_Enum.memory
            })
        }
        const updateComment = await this._commentModel.update(new Types.ObjectId(commentId) as Types.ObjectId, {
            attachments: urls,
            content,
            createdBy: req.user._id,
            tags: mentions,
            folderId,
            postId: comment.postId._id
        })
        if (!updateComment) {
            await this._s3Service.deleteFiles(urls) // if the comment creation failed we will delete the uploaded files from s3 to avoid having orphan files in s3 that are not associated with any comment in the database, and to save storage space and reduce costs.
            throw new AppError("Failed to update comment", 500)
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
            message: "Comment updated successfully",
            data: {
                updateComment
            }
        })

    }
    // all op in  comment apply also in reply





}

export default new commentService();