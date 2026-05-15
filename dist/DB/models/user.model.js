"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const user_enum_1 = require("../../common/enum/user.enum");
const post_model_1 = __importDefault(require("./post.model"));
const comment_model_1 = __importDefault(require("./comment.model"));
const userSchema = new mongoose_1.default.Schema({
    firstName: {
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
        type: Number, required: function () {
            return this.provider == user_enum_1.providerEnum.system ? true : false;
        }, min: 15, max: 60
    },
    phone: { type: String, trim: true },
    address: { type: String },
    password: {
        type: String, required: function () {
            return this.provider == user_enum_1.providerEnum.system ? true : false;
        }, trim: true, min: 6, max: 100
    },
    confirmed: { type: Boolean },
    role: { type: String, enum: user_enum_1.RoleEnum, default: user_enum_1.RoleEnum.user },
    gender: { type: String, enum: user_enum_1.GenderEnum, default: user_enum_1.GenderEnum.male },
    friends: {
        type: [mongoose_1.Types.ObjectId],
        ref: "User"
    }
}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual("username").get(function () {
    return `${this.firstName} ${this.lastName}`;
}).set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
});
userSchema.virtual("posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "createdBy"
});
userSchema.pre("deleteOne", { document: true, query: false }, async function () {
    const user = this;
    const posts = await post_model_1.default.find({
        createdBy: user._id
    });
    const postIds = posts.map(p => p._id);
    await comment_model_1.default.deleteMany({
        postId: { $in: postIds }
    });
    await post_model_1.default.deleteMany({
        createdBy: user._id
    });
});
const userModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = userModel;
