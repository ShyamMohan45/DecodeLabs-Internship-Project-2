import { randomUUID } from 'crypto';
import { User, PaginationMeta } from '../types/index.js';
import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { postRepository, PostRepository } from '../repositories/post.repository.js';
import { ConflictError, NotFoundError, BadRequestError } from '../errors/AppError.js';
import { CreateUserInput, UpdateUserInput, ListUsersQuery } from '../schemas/user.schema.js';

export class UserService {
  constructor(
    private userRepo: UserRepository = userRepository,
    private postRepo: PostRepository = postRepository
  ) {}

  async listUsers(query: ListUsersQuery): Promise<{ users: User[]; meta: PaginationMeta }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { items, total } = await this.userRepo.findMany({
      page,
      limit,
      role: query.role,
      status: query.status,
      search: query.search,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users: items,
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

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with id '${id}'`);
    }
    return user;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    // Semantic Validation: Check email uniqueness
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError(`A user with email '${input.email}' already exists`);
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr-${randomUUID().substring(0, 8)}`,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role || 'member',
      status: input.status || 'active',
      bio: input.bio,
      createdAt: now,
      updatedAt: now,
    };

    return this.userRepo.create(newUser);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    // Semantic Validation: Ensure user exists
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with id '${id}'`);
    }

    // Semantic Validation: If email changed, check uniqueness
    if (input.email && input.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = await this.userRepo.findByEmail(input.email);
      if (emailTaken && emailTaken.id !== id) {
        throw new ConflictError(`Email '${input.email}' is already in use by another account`);
      }
    }

    // Semantic Validation: Admin protection rule
    if (user.role === 'admin' && input.status === 'suspended') {
      const { items: allUsers } = await this.userRepo.findMany({ role: 'admin', status: 'active' });
      if (allUsers.length <= 1 && allUsers[0].id === id) {
        throw new BadRequestError('Cannot suspend the sole active administrator account');
      }
    }

    const updated = await this.userRepo.update(id, input);
    if (!updated) {
      throw new NotFoundError(`User with id '${id}'`);
    }

    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    // Semantic Validation: Ensure target user exists
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError(`User with id '${id}'`);
    }

    // Business Constraint: Clean up dependent posts on author deletion
    await this.postRepo.deleteByAuthorId(id);
    await this.userRepo.delete(id);
  }
}

export const userService = new UserService();
