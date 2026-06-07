"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const authFunction_1 = require("../../common/utils/authFunction");
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const chat_gateway_1 = __importDefault(require("../chat/realtime/chat.gateway"));
class SocketGateway {
    constructor() { }
    initIo = async (httpServer) => {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*"
            }
        });
        io.use(async (socket, next) => {
            try {
                console.log("socket handshake auth", socket.handshake.auth.authorization);
                const { user } = await (0, authFunction_1.authenticationFunc)(socket.handshake.auth.authorization ||
                    socket.handshake.headers.authorization);
                socket.data.user = user;
                next();
            }
            catch (err) {
                console.log("AUTH ERROR =>", err);
                next(new global_error_handling_1.AppError("Unauthorized", 401));
            }
        });
        io.on("connection", async (socket) => {
            redis_service_1.default.addSocket({ userId: socket.data.user._id, socketId: socket.id });
            await chat_gateway_1.default.registerEvent(socket, io);
            socket.on("disconnect", async () => {
                await redis_service_1.default.removeSocket({ userId: socket.data.user._id, socketId: socket.id });
                console.log({ userSocketIdsAfterDisconnect: await redis_service_1.default.getSockets(socket.data.user._id) });
            });
        });
    };
}
exports.default = new SocketGateway();
