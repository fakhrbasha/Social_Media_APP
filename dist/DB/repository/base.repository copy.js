"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utils/global-error-handling");
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async checkUser(email) {
        const emailExist = await this.model.findOne({ filter: { email } });
        if (emailExist) {
            return (new global_error_handling_1.AppError("Email already exists", 409));
        }
        return true;
    }
    async create(data) {
        return this.model.create(data);
    }
    async findById(id) {
        return this.model.findById(id);
    }
    async findOne({ filter, projection }) {
        return this.model.findOne(filter, projection);
    }
    async find({ filter, projection, options }) {
        return this.model.find(filter, projection)
            .sort(options?.sort)
            .skip(options?.skip)
            .limit(options?.limit)
            .populate(options?.populate);
    }
    async findOneAndUpdate({ id, update, options }) {
        return this.model.findByIdAndUpdate(id, update, { ...options, new: true });
    }
    async findOneAndDelete(id) {
        return this.model.findByIdAndDelete(id);
    }
}
exports.default = BaseRepository;
