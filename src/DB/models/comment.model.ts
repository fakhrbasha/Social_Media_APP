




import mongoose, { HydratedDocument, Types } from "mongoose";
import { AllowCommentEnum, AvailabilityEnum } from "../../common/enum/postEnum";




export interface IComment {
    content: string,
    post: Types.ObjectId,
    createdBy: Types.ObjectId,

    likes: Types.ObjectId[],
    tags: Types.ObjectId[],
    reply: Types.ObjectId[],



}


const commentSchema = new mongoose.Schema<IComment>({
    content: {
        type: String, min: 3,
    },
    post: {
        type: Types.ObjectId,
        ref: "Post",
        required: true
    },

    createdBy: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },

    tags: [{
        type: Types.ObjectId,
        ref: "User",
    }],
    likes: [{
        type: Types.ObjectId,
        ref: "User",
    }],



}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})




const commentModel = mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);

export default commentModel;
export type CommentDocument = HydratedDocument<IComment>;