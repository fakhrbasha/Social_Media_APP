import { Router } from "express";
import UserService from "./comment.service";
import * as userValidation from "./comment.validation";
import { validation } from "../../common/middleware/validation";
import { authentication } from "../../common/middleware/authentication";
import { auth } from "google-auth-library";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import postService from "./comment.service";
import * as CS from "./comment.validation";
import commentService from "./comment.service";
const commentRouter = Router({ mergeParams: true }) // we need to set mergeParams to true to be able to access the postId parameter from the postRouter, because we will use this router as a sub-router of the postRouter, and we need to access the postId parameter in the comment controller to be able to create a comment for a specific post.;
// post/postId/comment

commentRouter.post("/", authentication, multerCloud({ store_type: Store_Enum.memory }).array("attachments"), validation(CS.createCommentSchema), commentService.createComment)

commentRouter.get("/", authentication, commentService.getAllComments)
commentRouter.patch("/:commentId", authentication, multerCloud({ store_type: Store_Enum.memory }).array("attachments"), validation(CS.updateCommentSchema), commentService.updateComment)

commentRouter.post("/:commentId/reply", authentication, multerCloud({ store_type: Store_Enum.memory }).array("attachments"), validation(CS.createReplySchema), commentService.createReply)

commentRouter.delete("/:commentId", authentication, validation(CS.deleteCommentSchema), commentService.deleteComment)


export default commentRouter