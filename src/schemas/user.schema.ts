import { z } from 'zod';

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'User ID parameter cannot be empty'),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(50, 'Name cannot exceed 50 characters'),
    email: z
      .string()
      .trim()
      .email('Invalid email address format')
      .toLowerCase(),
    role: z.enum(['admin', 'editor', 'member']).default('member'),
    status: z.enum(['active', 'suspended', 'pending']).default('active'),
    bio: z.string().trim().max(250, 'Bio cannot exceed 250 characters').optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, 'User ID is required'),
  }),
  body: z
    .object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50).optional(),
      email: z.string().trim().email('Invalid email address format').toLowerCase().optional(),
      role: z.enum(['admin', 'editor', 'member']).optional(),
      status: z.enum(['active', 'suspended', 'pending']).optional(),
      bio: z.string().trim().max(250).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field (name, email, role, status, bio) must be provided for update',
    }),
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    role: z.enum(['admin', 'editor', 'member']).optional(),
    status: z.enum(['active', 'suspended', 'pending']).optional(),
    search: z.string().trim().optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>['query'];
