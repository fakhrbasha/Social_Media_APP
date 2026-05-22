"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation_gql = exports.validation = void 0;
const global_error_handling_1 = require("../utils/global-error-handling");
const graphql_1 = require("graphql");
const validation = (schema) => {
    return (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.attachment = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
            const result = schema[key]?.safeParse(req[key]);
            if (!result?.success) {
                validationError.push(result.error.message);
            }
        }
        if (validationError.length > 0) {
            throw new global_error_handling_1.AppError(JSON.parse(validationError), 400);
        }
        next();
    };
};
exports.validation = validation;
const validation_gql = async (schema, data) => {
    const validationError = [];
    const result = await schema.safeParseAsync(data);
    if (!result?.success) {
        const error = result.error.issues.map((err) => {
            return {
                path: err.path[0],
                message: err.message
            };
        });
        validationError.push(...error);
    }
    if (validationError.length) {
        throw new graphql_1.GraphQLError("validation error", {
            extensions: {
                code: "BAD_REQUEST",
                status: 400,
                errors: validationError
            }
        });
    }
};
exports.validation_gql = validation_gql;
