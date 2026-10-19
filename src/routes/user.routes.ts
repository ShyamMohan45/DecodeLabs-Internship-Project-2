import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from '../schemas/user.schema.js';
import {
  userPostsParamSchema,
  createNestedPostSchema,
} from '../schemas/post.schema.js';

const router = Router();

// Standard REST Collection Routes
router
  .route('/')
  .get(validateRequest(listUsersQuerySchema), userController.listUsers)
  .post(validateRequest(createUserSchema), userController.createUser);

// Nested Resource Routes: /api/v1/users/:userId/posts
router
  .route('/:userId/posts')
  .get(validateRequest(userPostsParamSchema), userController.getUserPosts)
  .post(validateRequest(createNestedPostSchema), userController.createUserPost);

// Standard REST Singular Resource Routes
router
  .route('/:id')
  .get(validateRequest(userIdParamSchema), userController.getUserById)
  .put(validateRequest(updateUserSchema), userController.updateUser)
  // Protected deletion: Demonstrates 401 & 403 HTTP status checks
  .delete(
    validateRequest(userIdParamSchema),
    authenticate,
    requireRole(['admin']),
    userController.deleteUser
  );

export default router;
