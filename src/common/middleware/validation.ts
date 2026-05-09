import { NextFunction, Request, Response } from "express"
import { ZodType } from "zod"
import { AppError } from "../utils/global-error-handling"



type reqTypes = keyof Request //"body" | "query" | "params" 
type schemaType = Partial<Record<reqTypes, ZodType>>
// use partial to make all properties of the schemaType optional, so that we can use it to validate only the properties that we want to validate, and ignore the rest of the properties in the request body, query, or params.

export const validation = (schema: schemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {

        const validationError = []
        for (const key of Object.keys(schema) as reqTypes[]) {
            if (!schema[key]) continue; // if the schema for the current key is not defined, we will skip the validation for that key and move on to the next key in the schema object.

            if (req.file) {
                req.body.attachment = req.file // if the request contains a file, we will add the file to the request body, so that we can validate the file using the Zod schema, and we can also access the file in the controller function if the validation is successful.`
            }
            if (req.files) {
                req.body.attachments = req.files
            }
            const result = schema[key]?.safeParse(req[key]) // we can use the safeParse method of the ZodType to validate the request body, query, or params, and get a result object that contains the success property and the error property if the validation fails.
            if (!result?.success) {
                validationError.push(result.error.message) // if the validation fails, we will push the error message to the validationError array, so that we can send all the validation errors in the response body, instead of just the first validation error.
            }

        }
        if (validationError.length > 0) {
            throw new AppError(JSON.parse(validationError as unknown as string), 400)
        }
        next();
    }
}