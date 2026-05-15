import { HydratedDocument, PopulateOptions, ProjectionType, Query, QueryFilter, QueryOptions, Types, UpdateQuery } from "mongoose";
import { Model } from "mongoose";
import { AppError } from "../../common/utils/global-error-handling";

// make abstract class to make sure that the class can't be instantiated directly, and it can only be extended by other classes, so that we can ensure that the class is only used as a base class for other classes, and it can't be used directly to create an instance of the class, which will

abstract class BaseRepository<TDocument> {

    constructor(protected readonly model: Model<TDocument>) { }


    async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
        return this.model.create(data);
    }

    async findById(id: Types.ObjectId): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findById(id);
    }

    async findOne({
        filter,
        projection,
        options
    }: {
        filter: QueryFilter<TDocument>,
        projection?: ProjectionType<TDocument> // select specific fields to return from the document, we can use the projection parameter to specify which fields we want to return from the document, so that we can reduce the amount of data that is returned from the database and improve the performance of the application.
        options?: QueryOptions<TDocument>

    }):
        Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOne(filter, projection, options);
    }
    async find({
        filter,
        projection, // select
        options
    }: {
        filter: QueryFilter<TDocument>,
        projection?: ProjectionType<TDocument>
        options?: QueryOptions<TDocument>
    }):
        Promise<HydratedDocument<TDocument>[] | []> {
        return this.model.find(filter, projection)
            .sort(options?.sort)
            .skip(options?.skip!)
            .limit(options?.limit!)
            .populate(options?.populate as PopulateOptions)
    }

    async findOneAndUpdate({
        filter,
        update,
        options
    }: {
        filter: QueryFilter<TDocument>,
        update: UpdateQuery<TDocument>,
        options?: QueryOptions<TDocument>
    }): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOneAndUpdate(filter, update, { ...options, new: true });
    }

    async findOneAndDelete(filter: QueryFilter<TDocument>): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOneAndDelete(filter);
    }


    // async find(filter: Partial<TDocument>): Promise<HydratedDocument<TDocument>[]> {
    //     return this.model.find(filter);
    // }

    async update(
        filter: any,
        data: Partial<TDocument>
    ): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findOneAndUpdate(
            filter,
            data,
            { new: true }
        );
    }

    async paginate<T>({
        page,
        limit,
        sort,
        populate,
        search
    }: {
        page?: number,
        limit?: number,
        sort?: any,
        populate?: any,
        search?: QueryFilter<T>
    }) {

        page = +page! || 1
        limit = +limit! || 2
        if (page < 0) page = 1
        if (limit < 0) limit = 2
        const skip = (page - 1) * limit

        const [data, totalDoc] = await Promise.all([
            this.model.find({ ...(search ?? {}) })
                .skip(skip)
                .limit(limit)
                .populate(populate)
                .sort(sort), ,
            this.model.countDocuments({ ...(search ?? {}) })
        ])
        const totalPages = Math.ceil(totalDoc! / limit)

        return {
            meta: {
                currentPage: page,
                totalPages,
                limit,
                totalDoc
            },
            data
        }

    }

    async delete(id: Types.ObjectId): Promise<HydratedDocument<TDocument> | null> {
        return this.model.findByIdAndDelete(id);
    }



}

export default BaseRepository;

//  `partial` mean : that the type of the data parameter is a partial type of the TDocument type, which means that all the properties of the TDocument type are optional in the data parameter, so that we can create a new document with only some of the properties of the TDocument type, and the rest of the properties will be set to their default values in the database.