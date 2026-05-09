import multer from "multer";
import { Store_Enum } from "../enum/multer.enum";
import { tmpdir } from "node:os";
import { Request } from "express";
import { multer_enum } from "../enum/multer.enum"

const multerCloud = (
    {
        store_type = Store_Enum.memory,
        custom_types = multer_enum.image,
        max_size = 1024 * 1024 * 5
    }:
        {
            store_type?: Store_Enum,
            custom_types?: string[]
            max_size?: number
        } = {}) => {

    const storage = store_type === Store_Enum.memory ? multer.memoryStorage() : multer.diskStorage({ // disk to large size ATTACHMENT
        destination: tmpdir(), // temp
        filename: function (req: Request, file: Express.Multer.File, cb: Function) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, uniqueSuffix + "__" + file.originalname)
        }
    })
    function fileFilter(req: Request, file: Express.Multer.File, cb: Function) {

        if (!custom_types.includes(file.mimetype))
            cb(new Error('Invalid File Type'))
        else
            cb(null, true)
    }

    const upload = multer({ storage, fileFilter, limits: { fileSize: max_size } })
    return upload
}


export default multerCloud
