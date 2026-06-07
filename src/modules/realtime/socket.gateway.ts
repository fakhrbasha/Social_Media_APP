import { Server } from "socket.io";
import { Server as httpServer } from "http";
import { authenticationFunc } from "../../common/utils/authFunction";
import redisService from "../../common/services/redis.service";
import { AppError } from "../../common/utils/global-error-handling";
import chatGateway from "../chat/realtime/chat.gateway";


class SocketGateway {
    constructor() { }


    initIo = async (httpServer: httpServer) => {
        const io = new Server(httpServer, {
            cors: {
                origin: "*"
            }
        })
        // auth

        io.use(async (socket, next) => {
            try {
                console.log("socket handshake auth", socket.handshake.auth.authorization);

                const { user } = await authenticationFunc(
                    socket.handshake.auth.authorization ||
                    socket.handshake.headers.authorization
                );

                socket.data.user = user;

                next();
            } catch (err) {
                console.log("AUTH ERROR =>", err);
                next(new AppError("Unauthorized", 401));
            }
        });
        io.on("connection", async (socket) => {
            redisService.addSocket({ userId: socket.data.user._id, socketId: socket.id })
            // console.log({ userSocketId: await redisService.getSockets(socket.data.user._id) })
            await chatGateway.registerEvent(socket, io)
            // from gateway -> chatEvent -> service
            // to remove socketid when disconnect 
            socket.on("disconnect", async () => {
                await redisService.removeSocket({ userId: socket.data.user._id, socketId: socket.id })
                console.log({ userSocketIdsAfterDisconnect: await redisService.getSockets(socket.data.user._id) })
            })
        }
        )
    }
}

export default new SocketGateway()