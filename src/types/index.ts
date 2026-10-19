import { Request } from 'express';

export type UserRole = 'admin' | 'editor' | 'member';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  status: PostStatus;
  tags: string[];
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface AuthContext {
  userId: string;
  role: UserRole;
  token: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
}
