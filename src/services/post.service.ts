import { randomUUID } from 'crypto';
import { Post, PaginationMeta } from '../types/index.js';
import { postRepository, PostRepository } from '../repositories/post.repository.js';
import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { BadRequestError, NotFoundError } from '../errors/AppError.js';
import { CreatePostInput, UpdatePostInput, ListPostsQuery } from '../schemas/post.schema.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class PostService {
  constructor(
    private postRepo: PostRepository = postRepository,
    private userRepo: UserRepository = userRepository
  ) {}

  async listPosts(query: ListPostsQuery): Promise<{ posts: Post[]; meta: PaginationMeta }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { items, total } = await this.postRepo.findMany({
      page,
      limit,
      status: query.status,
      authorId: query.authorId,
      tag: query.tag,
      search: query.search,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      posts: items,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getPostById(id: string): Promise<Post> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError(`Post with id '${id}'`);
    }
    return post;
  }

  async getPostsByAuthor(
    authorId: string,
    query?: { page?: number; limit?: number; status?: string }
  ): Promise<{ posts: Post[]; meta: PaginationMeta }> {
    // Semantic Validation: Verify author exists
    const author = await this.userRepo.findById(authorId);
    if (!author) {
      throw new NotFoundError(`Author (User) with id '${authorId}'`);
    }

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const { items, total } = await this.postRepo.findMany({
      authorId,
      status: query?.status,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      posts: items,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async createPost(input: CreatePostInput): Promise<Post> {
    // Semantic Validation: Author existence check
    const author = await this.userRepo.findById(input.authorId);
    if (!author) {
      throw new NotFoundError(`Author (User) with id '${input.authorId}'`);
    }

    // Semantic Validation: Author status check
    if (author.status === 'suspended') {
      throw new BadRequestError(`Cannot publish or draft posts for a suspended user account (${input.authorId})`);
    }

    // Semantic Validation: Quality check for published posts
    if (input.status === 'published' && input.content.trim().length < 20) {
      throw new BadRequestError('Published posts must have at least 20 characters of substantive content');
    }

    const now = new Date().toISOString();
    const slugBase = slugify(input.title);
    const uniqueSuffix = randomUUID().substring(0, 6);
    const slug = `${slugBase}-${uniqueSuffix}`;

    const newPost: Post = {
      id: `pst-${randomUUID().substring(0, 8)}`,
      title: input.title,
      slug,
      content: input.content,
      authorId: input.authorId,
      status: input.status || 'draft',
      tags: input.tags || [],
      viewsCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: input.status === 'published' ? now : undefined,
    };

    return this.postRepo.create(newPost);
  }

  async updatePost(id: string, input: UpdatePostInput): Promise<Post> {
    // Semantic Validation: Post must exist
    const existing = await this.postRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Post with id '${id}'`);
    }

    // Semantic Validation: Business rule on lifecycle state transitions
    if (existing.status === 'archived' && input.status === 'draft') {
      throw new BadRequestError('Archived posts cannot be reverted directly to draft status');
    }

    if (input.status === 'published') {
      const finalContent = input.content ?? existing.content;
      if (finalContent.trim().length < 20) {
        throw new BadRequestError('Published posts must have at least 20 characters of substantive content');
      }
    }

    const updates: Partial<Post> = {
      ...input,
    };

    if (input.title) {
      const slugBase = slugify(input.title);
      updates.slug = `${slugBase}-${existing.id.substring(4)}`;
    }

    if (input.status === 'published' && !existing.publishedAt) {
      updates.publishedAt = new Date().toISOString();
    }

    const updated = await this.postRepo.update(id, updates);
    if (!updated) {
      throw new NotFoundError(`Post with id '${id}'`);
    }

    return updated;
  }

  async deletePost(id: string): Promise<void> {
    const existing = await this.postRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Post with id '${id}'`);
    }

    await this.postRepo.delete(id);
  }
}

export const postService = new PostService();
