

import mongoose, { HydratedDocument, Types } from "mongoose";
// import { AllowCommentEnum, AvailabilityEnum } from "../../common/enum/ChatEnum";


interface IMessage {
    createdBy: Types.ObjectId,
    content: string
}

export interface IChat {
    // ovo one verse one


    createdBy: Types.ObjectId,
    participants: Types.ObjectId[],
    messages: IMessage[],

    // ovm 

    group: string,
    groupImage: string,
    roomId: string
}


const messageSchema = new mongoose.Schema<IMessage>({
    content: { type: String, required: true },
    createdBy: { type: Types.ObjectId, required: true, ref: "User" }


}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})
const ChatSchema = new mongoose.Schema<IChat>({
    createdBy: { type: Types.ObjectId, required: true, ref: "User" },
    participants: [{ type: Types.ObjectId, required: true, ref: "User" }],
    messages: [messageSchema],
    roomId: String,
    group: String,
    groupImage: String



}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})




const ChatModel = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

export default ChatModel;
export type ChatDocument = HydratedDocument<IChat>;