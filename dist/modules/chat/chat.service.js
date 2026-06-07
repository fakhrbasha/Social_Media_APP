"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repository/user.repository"));
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const chat_repository_1 = __importDefault(require("../../DB/repository/chat.repository"));
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
class ChatService {
    constructor() { }
    _userRepo = new user_repository_1.default();
    _chatRepo = new chat_repository_1.default();
    getChat = async (req, res, next) => {
        const { userId } = req.params;
        const chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id, userId],
                },
                group: { $exists: false }
            },
            options: {
                populate: [
                    { path: "participants" }
                ]
            }
        });
        if (!chat) {
            throw new global_error_handling_1.AppError("chat not found", 404);
        }
        return res.status(200).json({
            message: "done",
            data: {
                chat
            }
        });
    };
    sayHi = async (data) => {
        console.log(data);
    };
    sendMessage = async (data, socket, io) => {
        const { content, sendTo } = data;
        const createdBy = socket.data.user._id;
        const user = await this._userRepo.findOne({
            filter: { _id: sendTo }
        });
        if (!user) {
            throw new global_error_handling_1.AppError("user not found");
        }
        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                participants: {
                    $all: [sendTo, createdBy],
                },
                group: { $exists: false }
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    }
                }
            }
        });
        if (!chat) {
            await this._chatRepo.create({
                createdBy,
                messages: [{
                        content,
                        createdBy
                    }],
                participants: [sendTo, createdBy]
            });
        }
        io.to(await redis_service_1.default.getSockets(createdBy)).emit('successMessage', { content });
        io.to(await redis_service_1.default.getSockets(sendTo)).emit('newMessage', { content, from: socket.data.user });
    };
}
exports.default = new ChatService();
