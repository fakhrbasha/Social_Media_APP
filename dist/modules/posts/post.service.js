"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const jwt_service_1 = __importDefault(require("../../common/utils/jwt/jwt.service"));
const s3_service_1 = require("../../common/services/s3.service");
const notification_service_1 = __importDefault(require("../../common/services/notification.service"));
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../../common/enum/multer.enum");
const post_repository_1 = __importDefault(require("../../DB/repository/post.repository"));
const post_utils_1 = require("../../common/utils/post.utils");
class postService {
    _userModel = new user_repository_1.default();
    _postModel = new post_repository_1.default();
    _tokenService = jwt_service_1.default;
    _redisService = redis_service_1.default;
    _s3Service = new s3_service_1.S3Service();
    _notificationServiceConfig = notification_service_1.default;
    constructor() { }
    createPost = async (req, res, next) => {
        const { allowComment, availability, content, tags } = req.body;
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
                path: `users/${req.user._id}/posts/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory
            });
        }
        const post = await this._postModel.create({
            attachments: urls,
            content,
            createdBy: req.user._id,
            tags: mentions,
            folderId,
            availability,
            allowComments: allowComment
        });
        if (!post) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handling_1.AppError("Failed to create post", 500);
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
            message: "Post created successfully",
            data: {
                post
            }
        });
    };
    getPosts = async (req, res, next) => {
        const searchQuery = req.query?.search ? { content: { $regex: req.query.search, $options: "i" } } : {};
        const posts = await this._postModel.paginate({
            page: +req.query?.page,
            limit: +req.query?.limit,
            search: {
                $or: [
                    ...(0, post_utils_1.PostAvailability)(req)
                ],
                ...searchQuery
            },
            populate: {
                path: "comments",
                match: {
                    commentId: { $exists: false }
                },
                populate: [{
                        path: "replies",
                    }]
            }
        });
        return res.status(200).json({
            status: "success",
            message: "Posts retrieved successfully",
            data: {
                posts
            }
        });
    };
    getMyPosts = async (req, res, next) => {
        const posts = await this._postModel.find({
            filter: {
                createdBy: req.user._id
            },
            options: {
                populate: {
                    path: "comments",
                }
            }
        });
        return res.status(200).json({
            status: "success",
            message: "Posts retrieved successfully",
            data: {
                posts
            }
        });
    };
    getAllPosts = async (req, res, next) => {
        const posts = await this._postModel.find({
            filter: {}
        });
        return res.status(200).json({
            status: "success",
            message: "Posts retrieved successfully",
            data: {
                posts
            }
        });
    };
    getPostById = async (req, res, next) => {
        const { id } = req.params;
        const post = await this._postModel.findOne({ filter: { _id: id } });
        if (!post) {
            throw new global_error_handling_1.AppError("Post not found", 404);
        }
        return res.status(200).json({
            status: "success",
            message: "Post retrieved successfully",
            data: {
                post
            }
        });
    };
    deletePost = async (req, res, next) => {
        const { id } = req.params;
        const post = await this._postModel.findOne({ filter: { _id: id } });
        if (!post) {
            throw new global_error_handling_1.AppError("Post not found", 404);
        }
        if (post.createdBy.toString() !== req.user._id.toString()) {
            throw new global_error_handling_1.AppError("You are not authorized to delete this post", 403);
        }
        await this._postModel.findOneAndDelete(post._id);
        if (post.attachments?.length) {
            await this._s3Service.deleteFiles(post.attachments);
        }
        return res.status(200).json({
            status: "success",
            message: "Post deleted successfully",
        });
    };
    updatePost = async (req, res, next) => {
        const { id } = req.params;
        const { allowComment, availability, content, tags } = req.body;
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
                path: `users/${req.user._id}/posts/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory
            });
        }
        const post = await this._postModel.update({ _id: id }, { attachments: urls, content, tags: mentions, availability, allowComments: allowComment });
        if (!post) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handling_1.AppError("Failed to update post", 500);
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
            message: "Post updated successfully",
            data: {
                post
            }
        });
    };
    LikeOrUnlikePost = async (req, res, next) => {
        const { postId } = req.params;
        const { flag } = req.query;
        if (Array.isArray(postId)) {
            throw new global_error_handling_1.AppError("Invalid post Id", 400);
        }
        let updateQuery = {
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
                ...(0, post_utils_1.PostAvailability)(req)
            },
            update: updateQuery,
            options: {
                new: true,
            }
        });
        if (!post) {
            throw new global_error_handling_1.AppError("Post not found", 404);
        }
        return res.status(200).json({
            message: "Done",
            post
        });
    };
}
exports.default = new postService();
