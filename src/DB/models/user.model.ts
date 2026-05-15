

import mongoose, { HydratedDocument, Types } from "mongoose";
import { EmailEnum, GenderEnum, providerEnum, RoleEnum } from "../../common/enum/user.enum";
import postModel from "./post.model";
import CommentModel from "./comment.model";




export interface IUser {
    _id: Types.ObjectId,
    firstName: string,
    lastName: string,
    username: string, // virtual key
    email: string,
    age: number,
    phone?: string,
    address?: string,
    password: string,
    confirmed?: boolean,
    role?: RoleEnum,
    gender?: GenderEnum,
    provider?: providerEnum,
    pictures?: string[],
    friends?: Types.ObjectId[],



    createdAt?: Date,
    updatedAt?: Date
}


const userSchema = new mongoose.Schema<IUser>({
    firstName:
    {
        type: String,
        required: true,
        trim: true,
        min: 2,
        max: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        min: 2,
        max: 50
    },
    email: { type: String, required: true, unique: true, trim: true },
    age: {
        type: Number, required: function (): boolean {
            return this.provider == providerEnum.system ? true : false
        }, min: 15, max: 60
    },
    phone: { type: String, trim: true },
    address: { type: String },
    password: {
        type: String, required: function (): boolean {
            return this.provider == providerEnum.system ? true : false
        }, trim: true, min: 6, max: 100
    },
    confirmed: { type: Boolean },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    friends: {
        type: [Types.ObjectId],
        ref: "User"
    }

}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})



userSchema.virtual("username").get(function (this: IUser) {
    return `${this.firstName} ${this.lastName}`;
}).set(function (this: IUser, value: string) {
    const [firstName, lastName] = value.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
})

userSchema.virtual("posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "createdBy"
});

userSchema.pre(
    "deleteOne",
    { document: true, query: false },
    async function () {

        const user = this;

        const posts = await postModel.find({
            createdBy: user._id
        });

        const postIds = posts.map(p => p._id);

        await CommentModel.deleteMany({
            postId: { $in: postIds }
        });

        await postModel.deleteMany({
            createdBy: user._id
        });
    }
);
// userSchema.pre("save", function (this: HydratedDocument<IUser> & { is_new: boolean }) {
//     console.log("=========== pre hook ============")
//     // console.log(this);

//     this.is_new = this.isNew
//     console.log(this.isNew);


//     console.log(this.modifiedPaths())
//     if (this.isModified("password")) {
//         this.password = Hash({ plan_text: this.password })
//     }
// })
// userSchema.post("save", async function () {
//     console.log("=========== pre hook ============")
//     // console.log(this);
//     // console.log(this.isNew) // return bool if this document first time created or not

//     const that = this as HydratedDocument<IUser> & { is_new: boolean }
//     console.log(that.is_new);
//     if (that.is_new) {

//         const otp = await sendOtp()
//         eventEmitter.emit(EmailEnum.confirmedEmail, async () => {
//             await sendEmail({
//                 to: this.email,
//                 subject: "Email confirmation",
//                 html: templateEmail(otp)
//             })
//         })
//     }
// })


// run before create
// userSchema.pre("validate", function () {
//     console.log("=========== pre validate hook ============")
//     // console.log(this);
//     if (this.age < 18) { // priority > built in validation
//         throw new AppError("age to small")
//     }
// })

// run after create
// userSchema.post("validate", function () {
//     console.log("=========== post validate hook ============")
//     console.log(this);
// })


// query middleware

// userSchema.pre("updateOne", { document: true, query: false }, function () {
//     console.log("=========== updateOne hook ============")
//     console.log(this);
// })
// userSchema.pre("deleteOne", { document: true, query: false }, function () {
//     console.log("=========== deleteOne hook ============")
//     console.log(this);
// })
// userSchema.pre(/$regex/, { document: true, query: false }, function () {
//     console.log("=========== post validate hook ============")
//     console.log(this);
// })

// userSchema.pre(['deleteOne', 'updateOne'], { document: true, query: false }, function () {
//     console.log("=========== More  hook ============")
//     console.log(this);
// })



// userSchema.pre("findOne", function () {
//     console.log("==== pre hok findOne");
//     console.log(this.getQuery())

//     const { paranoid, ...rest } = this.getQuery()

//     if (!paranoid) {
//         this.setQuery({ ...rest })
//     } else {
//         this.setQuery({ ...rest, deletedAt: { $existsL: false } })
//     }
// })

const userModel = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default userModel;
export type UserDocument = HydratedDocument<IUser>;