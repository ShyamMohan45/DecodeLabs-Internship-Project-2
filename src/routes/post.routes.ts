import { Router } from 'express';
import { postController } from '../controllers/post.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import {
  createPostSchema,
  updatePostSchema,
  postIdParamSchema,
  listPostsQuerySchema,
} from '../schemas/post.schema.js';

const router = Router();

// Standard REST Collection Routes
router
  .route('/')
  .get(validateRequest(listPostsQuerySchema), postController.listPosts)
  .post(validateRequest(createPostSchema), postController.createPost);

// Standard REST Singular Resource Routes
router
  .route('/:id')
  .get(validateRequest(postIdParamSchema), postController.getPostById)
  .put(validateRequest(updatePostSchema), postController.updatePost)
  .delete(
    validateRequest(postIdParamSchema),
    authenticate,
    requireRole(['admin', 'editor']),
    postController.deletePost
  );

export default router;
