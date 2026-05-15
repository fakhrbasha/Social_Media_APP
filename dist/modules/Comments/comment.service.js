"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const mongoose_1 = require("mongoose");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const jwt_service_1 = __importDefault(require("../../common/utils/jwt/jwt.service"));
const s3_service_1 = require("../../common/services/s3.service");
const notification_service_1 = __importDefault(require("../../common/services/notification.service"));
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../../common/enum/multer.enum");
const post_repository_1 = __importDefault(require("../../DB/repository/post.repository"));
const postEnum_1 = require("../../common/enum/postEnum");
const post_utils_1 = require("../../common/utils/post.utils");
const comment_repository_1 = __importDefault(require("../../DB/repository/comment.repository"));
class commentService {
    _userModel = new user_repository_1.default();
    _postModel = new post_repository_1.default();
    _tokenService = jwt_service_1.default;
    _redisService = redis_service_1.default;
    _s3Service = new s3_service_1.S3Service();
    _commentModel = new comment_repository_1.default();
    _notificationServiceConfig = notification_service_1.default;
    constructor() { }
    createComment = async (req, res, next) => {
        const { content, tags } = req.body;
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            filter: {
                _id: postId,
                $or: [
                    ...(0, post_utils_1.PostAvailability)(req)
                ],
                allowComments: postEnum_1.AllowCommentEnum.allow
            },
        });
        if (!post) {
            throw new global_error_handling_1.AppError("Post not found or you are not allowed to comment on this post", 404);
        }
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            const mentionTags = await this._userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            });
            if (mentionTags.length !== tags.length) {
                throw new global_error_handling_1.AppError("some of the tags are not valid", 400);
            }
            for (const tag of mentionTags) {
                mentions.push(tag._id);
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req.user._id}/posts/${post.folderId}/comments/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory
            });
        }
        const comment = await this._commentModel.create({
            attachments: urls,
            content,
            createdBy: req.user._id,
            tags: mentions,
            folderId,
            postId: post._id
        });
        if (!comment) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handling_1.AppError("Failed to create comment", 500);
        }
        if (fcmTokens?.length) {
            await this._notificationServiceConfig.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "You are mentioned in a post",
                    body: `${req.user.firstName} mentioned you in a post`,
                }
            });
        }
        return res.status(201).json({
            status: "success",
            message: "Comment created successfully",
            data: {
                comment
            }
        });
    };
    createReply = async (req, res, next) => {
        const { content, tags } = req.body;
        const { postId, commentId } = req.params;
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
                                ...(0, post_utils_1.PostAvailability)(req)
                            ],
                            allowComments: postEnum_1.AllowCommentEnum.allow
                        }
                    }
                ]
            }
        });
        if (!comment) {
            throw new global_error_handling_1.AppError("comment not found or you are not allowed to comment on this post", 404);
        }
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            const mentionTags = await this._userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            });
            if (mentionTags.length !== tags.length) {
                throw new global_error_handling_1.AppError("some of the tags are not valid", 400);
            }
            for (const tag of mentionTags) {
                mentions.push(tag._id);
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req.user._id}/posts/${comment.postId.folderId}/comments/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory
            });
        }
        const reply = await this._commentModel.create({
            attachments: urls,
            content,
            createdBy: req.user._id,
            tags: mentions,
            folderId,
            postId: comment.postId._id,
            commentId: comment._id
        });
        if (!reply) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handling_1.AppError("Failed to create reply", 500);
        }
        if (fcmTokens?.length) {
            await this._notificationServiceConfig.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "You are mentioned in a post",
                    body: `${req.user.firstName} mentioned you in a post`,
                }
            });
        }
        return res.status(201).json({
            status: "success",
            message: "Reply created successfully",
            data: {
                reply
            }
        });
    };
    getAllComments = async (req, res, next) => {
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
    likeComment = async (req, res, next) => {
        const { commentId } = req.params;
        const { flag } = req.query;
        if (Array.isArray(commentId)) {
            throw new global_error_handling_1.AppError("Invalid comment id", 400);
        }
        let updateQuery = {
            $addToSet: {
                likes: req.user._id
            }
        };
        if (flag == 'dislike') {
            updateQuery = {
                $pull: { likes: req.user._id }
            };
        }
        const comment = await this._commentModel.findOneAndUpdate({
            filter: {
                _id: commentId,
                ...(0, post_utils_1.PostAvailability)(req)
            },
            update: updateQuery,
            options: {
                new: true
            }
        });
        if (!comment) {
            throw new global_error_handling_1.AppError("comment not found or you are not allowed to comment on this post", 404);
        }
        return res.status(200).json({
            status: "success",
            message: "Comment liked successfully",
            data: {
                comment
            }
        });
    };
    deleteComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                createdBy: req.user._id,
                ...(0, post_utils_1.PostAvailability)(req)
            }
        });
        if (!comment) {
            throw new global_error_handling_1.AppError("comment not found or you are not allowed to delete this comment", 404);
        }
        const folderId = comment.folderId;
        const postId = comment.postId.folderId;
        await this._s3Service.deleteFiles([
            `users/${req.user._id}/posts/${postId}/comments/${folderId}`
        ]);
        await this._commentModel.delete(new mongoose_1.Types.ObjectId(commentId));
        return res.status(200).json({
            status: "success",
            message: "Comment deleted successfully"
        });
    };
    updateComment = async (req, res, next) => {
        const { commentId } = req.params;
        const { content, tags } = req.body;
        const comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                createdBy: req.user._id,
                ...(0, post_utils_1.PostAvailability)(req)
            }
        });
        if (!comment) {
            throw new global_error_handling_1.AppError("comment not found or you are not allowed to update this comment", 404);
        }
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            const mentionTags = await this._userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            });
            if (mentionTags.length !== tags.length) {
                throw new global_error_handling_1.AppError("some of the tags are not valid", 400);
            }
            for (const tag of mentionTags) {
                mentions.push(tag._id);
                (await this._redisService.getFCMs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req.user._id}/posts/${comment.postId.folderId}/comments/${comment.folderId}`,
                store_type: multer_enum_1.Store_Enum.memory
            });
        }
        const updateComment = await this._commentModel.update(new mongoose_1.Types.ObjectId(commentId), {
            attachments: urls,
            content,
            createdBy: req.user._id,
            tags: mentions,
            folderId,
            postId: comment.postId._id
        });
        if (!updateComment) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handling_1.AppError("Failed to update comment", 500);
        }
        if (fcmTokens?.length) {
            await this._notificationServiceConfig.sendNotifications({
                tokens: fcmTokens,
                data: {
                    title: "You are mentioned in a post",
                    body: `${req.user.firstName} mentioned you in a post`,
                }
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Comment updated successfully",
            data: {
                updateComment
            }
        });
    };
}
exports.default = new commentService();
