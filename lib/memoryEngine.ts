// Operator Uplift Memory Engine
// 3-layer architecture: Supabase (source of truth) → localStorage (cache) → Search
// Cross-device, cross-session persistence via Supabase.

export interface MemoryEntry {
  id: string;
  name: string;
  description: string;
  type: 'user' | 'feedback' | 'project' | 'reference' | 'agent';
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  lastAccessed: string;
}

export interface MemoryIndex {
  version: number;
  entries: { id: string; name: string; description: string; type: string }[];
  lastConsolidated: string;
}

const MEMORY_CACHE_KEY = 'ou-memory-cache';
const MAX_INDEX_ENTRIES = 200;

function getUserId(): string {
  try {
    const u = localStorage.getItem('user');
    if (u) return JSON.parse(u).id || 'anon';
  } catch {}
  return 'anon';
}

// ── Cache layer (localStorage for instant reads) ──

function getCachedEntries(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(MEMORY_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function setCachedEntries(entries: MemoryEntry[]): void {
  try {
    localStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(entries.slice(0, MAX_INDEX_ENTRIES)));
  } catch {}
}

// ── Supabase layer (source of truth) ──

async function fetchFromSupabase(search?: string): Promise<MemoryEntry[]> {
  const userId = getUserId();
  const params = new URLSearchParams({ user_id: userId });
  if (search) params.set('search', search);

  try {
    const res = await fetch(`/api/memory/entries?${params}`);
    if (!res.ok) return getCachedEntries();
    const data = await res.json();
    const entries: MemoryEntry[] = (data.entries || []).map((e: Record<string, unknown>) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      type: e.type,
      content: e.content,
      tags: e.tags || [],
      createdAt: e.created_at || e.createdAt,
      updatedAt: e.updated_at || e.updatedAt,
      accessCount: e.access_count || e.accessCount || 0,
      lastAccessed: e.last_accessed || e.lastAccessed,
    }));
    setCachedEntries(entries);
    return entries;
  } catch {
    return getCachedEntries();
  }
}

async function saveToSupabase(entry: MemoryEntry): Promise<void> {
  try {
    await fetch('/api/memory/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: getUserId(),
        id: entry.id,
        name: entry.name,
        description: entry.description,
        type: entry.type,
        content: entry.content,
        tags: entry.tags,
      }),
    });
  } catch {}
}

async function deleteFromSupabase(id: string): Promise<void> {
  try {
    await fetch('/api/memory/entries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: getUserId(), id }),
    });
  } catch {}
}

// ── Public API ──

export function getMemoryIndex(): MemoryIndex {
  const entries = getCachedEntries();
  return {
    version: 1,
    entries: entries.map(e => ({ id: e.id, name: e.name, description: e.description, type: e.type })),
    lastConsolidated: new Date().toISOString(),
  };
}

export function getAllEntries(): MemoryEntry[] {
  return getCachedEntries();
}

/** Sync cache with Supabase. Call on page load. */
export async function syncMemory(): Promise<MemoryEntry[]> {
  return fetchFromSupabase();
}

export function addMemory(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessed'>): MemoryEntry {
  const now = new Date().toISOString();
  const newEntry: MemoryEntry = {
    ...entry,
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    accessCount: 0,
    lastAccessed: now,
  };

  const entries = getCachedEntries();
  entries.unshift(newEntry);
  setCachedEntries(entries);
  saveToSupabase(newEntry);

  return newEntry;
}

export function getMemory(id: string): MemoryEntry | null {
  const entries = getCachedEntries();
  const entry = entries.find(e => e.id === id);
  if (entry) {
    entry.accessCount++;
    entry.lastAccessed = new Date().toISOString();
    setCachedEntries(entries);
  }
  return entry || null;
}

export function updateMemory(id: string, updates: Partial<Pick<MemoryEntry, 'name' | 'description' | 'content' | 'tags' | 'type'>>): MemoryEntry | null {
  const entries = getCachedEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;

  entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
  setCachedEntries(entries);
  saveToSupabase(entries[idx]);

  return entries[idx];
}

export function deleteMemory(id: string): boolean {
  const entries = getCachedEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  setCachedEntries(filtered);
  deleteFromSupabase(id);

  return true;
}

export function searchMemory(query: string): MemoryEntry[] {
  const entries = getCachedEntries();
  const lower = query.toLowerCase();
  return entries.filter(e =>
    e.name.toLowerCase().includes(lower) ||
    e.description.toLowerCase().includes(lower) ||
    e.content.toLowerCase().includes(lower) ||
    e.tags.some(t => t.toLowerCase().includes(lower))
  ).sort((a, b) => b.accessCount - a.accessCount);
}

export function consolidateMemory(): { merged: number; removed: number } {
  const entries = getCachedEntries();
  let merged = 0;
  let removed = 0;

  const seen = new Map<string, MemoryEntry>();
  const deduped: MemoryEntry[] = [];
  for (const entry of entries) {
    const key = `${entry.type}:${entry.name.toLowerCase()}`;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (entry.content.length > existing.content.length) existing.content = entry.content;
      existing.tags = [...new Set([...existing.tags, ...entry.tags])];
      existing.accessCount += entry.accessCount;
      merged++;
    } else {
      seen.set(key, entry);
      deduped.push(entry);
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const active = deduped.filter(e => {
    if (e.lastAccessed > thirtyDaysAgo) return true;
    if (e.accessCount > 5) return true;
    removed++;
    return false;
  });

  setCachedEntries(active);
  return { merged, removed };
}

export function buildMemoryContext(query?: string): string {
  const entries = getCachedEntries();
  if (entries.length === 0) return '';

  let relevant: MemoryEntry[];
  if (query) {
    relevant = searchMemory(query).slice(0, 10);
  } else {
    relevant = [...entries]
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 10);
  }

  if (relevant.length === 0) return '';
  const lines = relevant.map(e => `[${e.type}] ${e.name}: ${e.description}`);
  return `\n\n--- Memory Context ---\n${lines.join('\n')}\n--- End Memory ---`;
}

export const MEMORY_TYPES = [
  { id: 'user', label: 'User', description: 'Information about the user (role, preferences, knowledge)' },
  { id: 'feedback', label: 'Feedback', description: 'Corrections and guidance for agent behavior' },
  { id: 'project', label: 'Project', description: 'Ongoing work, goals, deadlines, decisions' },
  { id: 'reference', label: 'Reference', description: 'Pointers to external resources (URLs, docs, tools)' },
  { id: 'agent', label: 'Agent', description: 'Agent-specific knowledge, configs, learned behaviors' },
];
