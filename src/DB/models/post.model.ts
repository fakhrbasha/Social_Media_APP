

import mongoose, { HydratedDocument, Types } from "mongoose";
import { AllowCommentEnum, AvailabilityEnum } from "../../common/enum/postEnum";




export interface IPost {
    content?: string
    attachments?: string[]

    createdBy: Types.ObjectId

    tags?: Types.ObjectId[],
    likes: Types.ObjectId[],

    allowComments?: AllowCommentEnum,
    availability?: AvailabilityEnum,

    folderId: string
    friends?: Types.ObjectId[]

    // comments: Types.ObjectId[],
}


const postSchema = new mongoose.Schema<IPost>({
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

    allowComments: {
        type: String,
        enum: AllowCommentEnum,
        default: AllowCommentEnum.allow
    },
    availability: {
        type: String,
        enum: AvailabilityEnum,
        default: AvailabilityEnum.public
    },
    friends: {
        type: [Types.ObjectId],
        ref: "User"
    },

    folderId: {
        type: String,
    },


}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

postSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "postId"
})


const postModel = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export default postModel;
export type PostDocument = HydratedDocument<IPost>;