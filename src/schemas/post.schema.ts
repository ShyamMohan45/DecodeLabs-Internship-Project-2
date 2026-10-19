import { z } from 'zod';

export const postIdParamSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Post ID is required'),
  }),
});

export const userPostsParamSchema = z.object({
  params: z.object({
    userId: z.string().trim().min(1, 'User ID is required'),
  }),
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      status: z.enum(['draft', 'published', 'archived']).optional(),
    })
    .optional(),
});

export const createPostSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters long')
      .max(120, 'Title cannot exceed 120 characters'),
    content: z
      .string()
      .trim()
      .min(10, 'Content must be at least 10 characters long'),
    authorId: z.string().trim().min(1, 'Author ID cannot be empty'),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    tags: z.array(z.string().trim().min(1)).max(10, 'Cannot exceed 10 tags').default([]),
  }),
});

export const createNestedPostSchema = z.object({
  params: z.object({
    userId: z.string().trim().min(1, 'User ID is required in URL path'),
  }),
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters long')
      .max(120, 'Title cannot exceed 120 characters'),
    content: z
      .string()
      .trim()
      .min(10, 'Content must be at least 10 characters long'),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    tags: z.array(z.string().trim().min(1)).max(10, 'Cannot exceed 10 tags').default([]),
  }),
});

export const updatePostSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'Post ID is required'),
  }),
  body: z
    .object({
      title: z.string().trim().min(3).max(120).optional(),
      content: z.string().trim().min(10).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      tags: z.array(z.string().trim().min(1)).max(10).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field (title, content, status, tags) must be provided for update',
    }),
});

export const listPostsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    authorId: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    search: z.string().trim().optional(),
  }),
});

export type CreatePostInput = z.infer<typeof createPostSchema>['body'];
export type CreateNestedPostInput = z.infer<typeof createNestedPostSchema>['body'];
export type UpdatePostInput = z.infer<typeof updatePostSchema>['body'];
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>['query'];
