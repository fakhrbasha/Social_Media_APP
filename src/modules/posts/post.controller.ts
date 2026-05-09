import { Router } from "express";
import UserService from "./post.service";
import * as userValidation from "./post.validation";
import { validation } from "../../common/middleware/validation";
import { authentication } from "../../common/middleware/authentication";
import { auth } from "google-auth-library";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import postService from "./post.service";
import * as PS from "./post.validation";
const postRouter = Router();


postRouter.post("/",
    authentication,
    multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
    validation(PS.createPostSchema)
    , postService.createPost)

postRouter.get("/", authentication, postService.getMyPosts)
postRouter.get("/feed", authentication, postService.getPosts)
postRouter.patch("/:postId", authentication, validation(PS.LikePostSchema), postService.LikeOrUnlikePost)
postRouter.put("/:id", authentication, multerCloud({ store_type: Store_Enum.memory }).array("attachments"), validation(PS.updatePostSchema), postService.updatePost)
postRouter.get("/:id", authentication, postService.getPostById)
postRouter.delete("/:id", authentication, postService.deletePost)

export default postRouter