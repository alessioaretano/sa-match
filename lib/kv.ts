import { Redis } from "@upstash/redis";

export interface KVStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, opts?: { ex?: number }): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  del(key: string): Promise<void>;
}

class MemoryKV implements KVStore {
  private store = new Map<string, { value: unknown; expiresAt: number | null }>();

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && entry.expiresAt < now) this.store.delete(key);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.cleanup();
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, opts?: { ex?: number }): Promise<void> {
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async incr(key: string): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0;
    const next = current + 1;
    const existing = this.store.get(key);
    this.store.set(key, { value: next, expiresAt: existing?.expiresAt ?? null });
    return next;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) entry.expiresAt = Date.now() + seconds * 1000;
  }

  async keys(pattern: string): Promise<string[]> {
    this.cleanup();
    const re = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return [...this.store.keys()].filter((k) => re.test(k));
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class UpstashKV implements KVStore {
  constructor(private redis: Redis) {}
  async get<T>(key: string): Promise<T | null> {
    return (await this.redis.get<T>(key)) ?? null;
  }
  async set<T>(key: string, value: T, opts?: { ex?: number }): Promise<void> {
    if (opts?.ex) await this.redis.set(key, value, { ex: opts.ex });
    else await this.redis.set(key, value);
  }
  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }
  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }
  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

let instance: KVStore | null = null;

export function getKV(): KVStore {
  if (instance) return instance;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    instance = new UpstashKV(new Redis({ url, token }));
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn("[kv] Production läuft mit MemoryKV — keine Persistenz! KV_REST_API_URL fehlt.");
    }
    instance = new MemoryKV();
  }
  return instance;
}

export function isKVPersistent(): boolean {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!(url && token);
}
