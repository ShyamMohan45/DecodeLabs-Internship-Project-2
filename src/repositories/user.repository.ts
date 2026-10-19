import { User } from '../types/index.js';

export class UserRepository {
  private users: Map<string, User> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const seedUsers: User[] = [
      {
        id: 'usr-admin-01',
        name: 'Ada Lovelace',
        email: 'ada.lovelace@example.com',
        role: 'admin',
        status: 'active',
        bio: 'First computer programmer and pioneer.',
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'usr-editor-01',
        name: 'Alan Turing',
        email: 'alan.turing@example.com',
        role: 'editor',
        status: 'active',
        bio: 'Father of modern computing and theoretical computer science.',
        createdAt: '2026-01-02T11:00:00.000Z',
        updatedAt: '2026-01-02T11:00:00.000Z',
      },
      {
        id: 'usr-member-01',
        name: 'Grace Hopper',
        email: 'grace.hopper@example.com',
        role: 'member',
        status: 'active',
        bio: 'Pioneered machine-independent programming languages and compilers.',
        createdAt: '2026-01-03T12:00:00.000Z',
        updatedAt: '2026-01-03T12:00:00.000Z',
      },
    ];

    seedUsers.forEach((user) => this.users.set(user.id, user));
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  async findMany(filters: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<{ items: User[]; total: number }> {
    let list = Array.from(this.users.values());

    if (filters.role) {
      list = list.filter((u) => u.role === filters.role);
    }
    if (filters.status) {
      list = list.filter((u) => u.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    // Sort descending by creation date
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit).map((u) => ({ ...u }));

    return { items, total };
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, { ...user });
    return { ...user };
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const existing = this.users.get(id);
    if (!existing) return null;

    const updated: User = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      createdAt: existing.createdAt, // Immutable creation timestamp
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }
}

export const userRepository = new UserRepository();
