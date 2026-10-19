import { Post } from '../types/index.js';

export class PostRepository {
  private posts: Map<string, Post> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const seedPosts: Post[] = [
      {
        id: 'pst-post-01',
        title: 'Notes on the Analytical Engine',
        slug: 'notes-on-the-analytical-engine',
        content: 'The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.',
        authorId: 'usr-admin-01',
        status: 'published',
        tags: ['computing', 'history', 'algorithms'],
        viewsCount: 142,
        createdAt: '2026-01-05T09:30:00.000Z',
        updatedAt: '2026-01-05T09:30:00.000Z',
        publishedAt: '2026-01-05T09:30:00.000Z',
      },
      {
        id: 'pst-post-02',
        title: 'Computing Machinery and Intelligence',
        slug: 'computing-machinery-and-intelligence',
        content: 'I propose to consider the question, "Can machines think?" This should begin with definitions of terms.',
        authorId: 'usr-editor-01',
        status: 'published',
        tags: ['ai', 'turing-test', 'philosophy'],
        viewsCount: 380,
        createdAt: '2026-01-06T14:15:00.000Z',
        updatedAt: '2026-01-06T14:15:00.000Z',
        publishedAt: '2026-01-06T14:15:00.000Z',
      },
      {
        id: 'pst-post-03',
        title: 'Draft: Modern Compiler Optimization Techniques',
        slug: 'draft-modern-compiler-optimization-techniques',
        content: 'A compiler translates code written in a high-level programming language into machine code or bytecode.',
        authorId: 'usr-member-01',
        status: 'draft',
        tags: ['compilers', 'systems'],
        viewsCount: 5,
        createdAt: '2026-01-07T16:00:00.000Z',
        updatedAt: '2026-01-07T16:00:00.000Z',
      },
    ];

    seedPosts.forEach((post) => this.posts.set(post.id, post));
  }

  async findById(id: string): Promise<Post | null> {
    const post = this.posts.get(id);
    return post ? { ...post } : null;
  }

  async findMany(filters: {
    page?: number;
    limit?: number;
    status?: string;
    authorId?: string;
    tag?: string;
    search?: string;
  }): Promise<{ items: Post[]; total: number }> {
    let list = Array.from(this.posts.values());

    if (filters.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters.authorId) {
      list = list.filter((p) => p.authorId === filters.authorId);
    }
    if (filters.tag) {
      list = list.filter((p) => p.tags.includes(filters.tag!));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit).map((p) => ({ ...p }));

    return { items, total };
  }

  async create(post: Post): Promise<Post> {
    this.posts.set(post.id, { ...post });
    return { ...post };
  }

  async update(id: string, updates: Partial<Post>): Promise<Post | null> {
    const existing = this.posts.get(id);
    if (!existing) return null;

    const updated: Post = {
      ...existing,
      ...updates,
      id: existing.id,
      authorId: existing.authorId, // Author is immutable
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.posts.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  async countByAuthorId(authorId: string): Promise<number> {
    let count = 0;
    for (const post of this.posts.values()) {
      if (post.authorId === authorId) count++;
    }
    return count;
  }

  async deleteByAuthorId(authorId: string): Promise<number> {
    let count = 0;
    for (const [id, post] of this.posts.entries()) {
      if (post.authorId === authorId) {
        this.posts.delete(id);
        count++;
      }
    }
    return count;
  }
}

export const postRepository = new PostRepository();
