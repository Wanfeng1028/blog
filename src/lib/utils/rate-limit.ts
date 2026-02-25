type Entry = { count: number; expiresAt: number };

const store = new Map<string, Entry>();

export function isRateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.expiresAt <= now) {
    store.set(key, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  if (current.count >= max) {
    return true;
  }

  store.set(key, { count: current.count + 1, expiresAt: current.expiresAt });
  return false;
}
