

import mongoose, { HydratedDocument, Types } from "mongoose";




export interface IComment {
    content?: string
    attachments?: string[]

    createdBy: Types.ObjectId

    tags?: Types.ObjectId[],
    likes: Types.ObjectId[],
    postId: Types.ObjectId,

    folderId: string,
    commentId?: Types.ObjectId

}


const CommentSchema = new mongoose.Schema<IComment>({
    content: {
        type: String, min: 3, required: function (this) {
            return !this.attachments?.length
        }
    },
    attachments: [String],

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


    // friends: {
    //     type: [Types.ObjectId],
    //     ref: "User"
    // },

    folderId: {
        type: String,
    },
    postId: {
        type: Types.ObjectId,
        ref: "Post",
        required: true
    },
    commentId: {
        type: Types.ObjectId,
        ref: "Comment"
    }


}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

CommentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "commentId"
})


const CommentModel = mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default CommentModel;
export type CommentDocument = HydratedDocument<IComment>;