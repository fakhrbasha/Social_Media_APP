import { NextFunction, Response, Request } from "express"
import UserRepository from "../../DB/repository/user.repository"
import { AppError } from "../../common/utils/global-error-handling"
import ChatRepository from "../../DB/repository/chat.repository"
import { Server, Socket } from "socket.io"
import redisService from "../../common/services/redis.service"



class ChatService {
    constructor() { }

    private readonly _userRepo = new UserRepository()
    private readonly _chatRepo = new ChatRepository()
    // rest apis 


    getChat = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params

        const chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id, userId],
                },
                group: { $exists: false } // ovo
            },
            options: {
                populate: [
                    { path: "participants" }
                ]
            }
        })
        // console.log({ chat });
        // console.log({
        //     currentUser: req.user?._id,
        //     friend: userId
        // });
        if (!chat) {
            throw new AppError("chat not found", 404)
        }



        return res.status(200).json({
            message: "done",
            data: {
                chat
            }
        })
    }
    // socket.io
    sayHi = async (data: any) => {
        console.log(data)
    }
    sendMessage = async (data: any, socket: Socket, io: Server) => {
        // console.log({ data, message: "send message" })
        const { content, sendTo } = data
        const createdBy = socket.data.user._id

        const user = await this._userRepo.findOne({
            filter: { _id: sendTo }
        })
        if (!user) {
            throw new AppError("user not found")
        }
        // has between chat 
        // push new message on messages 

        // didn't has chat create it


        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                participants: {
                    $all: [sendTo, createdBy],
                },
                group: { $exists: false }
            }
            , update: {
                // if chat has a messages
                $push: {
                    messages: {
                        content,
                        createdBy
                    }
                }
            }
        })
        if (!chat) {

            await this._chatRepo.create({
                createdBy,
                messages: [{
                    content,
                    createdBy
                }],
                participants: [sendTo, createdBy]
            })
        }
        // make two emit send and receive to show message after send direct
        io.to(await redisService.getSockets(createdBy)).emit('successMessage', { content })
        io.to(await redisService.getSockets(sendTo)).emit('newMessage', { content, from: socket.data.user })

    }


}

export default new ChatService()