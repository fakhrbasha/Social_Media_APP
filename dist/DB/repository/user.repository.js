"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const user_model_1 = __importDefault(require("../models/user.model"));
const base_repository_1 = __importDefault(require("./base.repository"));
class UserRepository extends base_repository_1.default {
    model;
    constructor(model = user_model_1.default) {
        super(model);
        this.model = model;
    }
    async checkUser(email) {
        const emailExist = await this.model.findOne({ filter: { email } });
        if (emailExist) {
            return (new global_error_handling_1.AppError("Email already exists", 409));
        }
        return true;
    }
}
exports.default = UserRepository;
