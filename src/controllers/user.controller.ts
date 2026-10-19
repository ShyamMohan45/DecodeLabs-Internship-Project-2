import { Request, Response, NextFunction } from 'express';
import { userService, UserService } from '../services/user.service.js';
import { postService, PostService } from '../services/post.service.js';
import { config } from '../config/index.js';

export class UserController {
  constructor(
    private users: UserService = userService,
    private posts: PostService = postService
  ) {}

  /**
   * GET /api/v1/users
   * 200 OK - Return paginated list of users
   */
  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.users.listUsers(req.query as any);
      res.status(200).json({
        success: true,
        data: result.users,
        meta: result.meta,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/users/:id
   * 200 OK - Return single user
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const user = await this.users.getUserById(id);
      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/users
   * 201 Created - Create new user resource
   */
  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.users.createUser(req.body);
      const resourceUrl = `${config.apiPrefix}/users/${created.id}`;

      res
        .status(201)
        .header('Location', resourceUrl)
        .json({
          success: true,
          message: 'User created successfully',
          data: created,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/users/:id
   * 200 OK - Replace/Update user resource
   */
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await this.users.updateUser(id, req.body);
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/users/:id
   * 204 No Content - Delete user resource
   */
  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      await this.users.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/users/:userId/posts
   * 200 OK - Nested resource endpoint returning all posts authored by user
   */
  getUserPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.userId);
      const result = await this.posts.getPostsByAuthor(userId, req.query as any);
      res.status(200).json({
        success: true,
        data: result.posts,
        meta: result.meta,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/users/:userId/posts
   * 201 Created - Nested resource creation for specific user
   */
  createUserPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.userId);
      const postInput = {
        ...req.body,
        authorId: userId,
      };
      const created = await this.posts.createPost(postInput);
      const resourceUrl = `${config.apiPrefix}/posts/${created.id}`;

      res
        .status(201)
        .header('Location', resourceUrl)
        .json({
          success: true,
          message: 'Post created successfully for user',
          data: created,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
