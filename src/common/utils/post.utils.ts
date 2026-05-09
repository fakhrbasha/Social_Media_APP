import { Request } from "express";
import { AvailabilityEnum } from "../enum/postEnum";


export const PostAvailability = (req: Request) => {
    return [
        { availability: AvailabilityEnum.public },
        { availability: AvailabilityEnum.private, createdBy: req.user._id },
        { availability: AvailabilityEnum.friends, createdBy: { $in: [...req.user?.friends || [], req.user._id] } },
        { tags: req.user._id }
    ]
}