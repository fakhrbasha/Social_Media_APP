import { HydratedDocument, PopulateOptions, ProjectionType, Query, QueryFilter, QueryOptions, Types, UpdateQuery } from "mongoose";
import { Model } from "mongoose";
import { AppError } from "../../common/utils/global-error-handling";
import userModel, { IUser } from "../models/user.model";
import BaseRepository from "./base.repository";


class UserRepository extends BaseRepository<IUser> {

    constructor(protected readonly model: Model<IUser> = userModel) {
        super(model)
    }


    async checkUser(email: string) {
        const emailExist = await this.model.findOne({ filter: { email } })

        if (emailExist) {
            return (new AppError("Email already exists", 409))
        }

        return true
    }

}

export default UserRepository;
