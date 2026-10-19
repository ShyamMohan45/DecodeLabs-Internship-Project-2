import { Request, Response, NextFunction } from 'express';
import { postService, PostService } from '../services/post.service.js';
import { config } from '../config/index.js';

export class PostController {
  constructor(private posts: PostService = postService) {}

  /**
   * GET /api/v1/posts
   * 200 OK - Return paginated and filtered list of posts
   */
  listPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.posts.listPosts(req.query as any);
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
   * GET /api/v1/posts/:id
   * 200 OK - Return single post by id
   */
  getPostById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const post = await this.posts.getPostById(id);
      res.status(200).json({
        success: true,
        data: post,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/posts
   * 201 Created - Create post resource
   */
  createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.posts.createPost(req.body);
      const resourceUrl = `${config.apiPrefix}/posts/${created.id}`;

      res
        .status(201)
        .header('Location', resourceUrl)
        .json({
          success: true,
          message: 'Post created successfully',
          data: created,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/posts/:id
   * 200 OK - Update post resource
   */
  updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await this.posts.updatePost(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/posts/:id
   * 204 No Content - Delete post resource
   */
  deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      await this.posts.deletePost(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const postController = new PostController();
