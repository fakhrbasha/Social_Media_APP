"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostAvailability = void 0;
const postEnum_1 = require("../enum/postEnum");
const PostAvailability = (req) => {
    return [
        { availability: postEnum_1.AvailabilityEnum.public },
        { availability: postEnum_1.AvailabilityEnum.private, createdBy: req.user._id },
        { availability: postEnum_1.AvailabilityEnum.friends, createdBy: { $in: [...req.user?.friends || [], req.user._id] } },
        { tags: req.user._id }
    ];
};
exports.PostAvailability = PostAvailability;
