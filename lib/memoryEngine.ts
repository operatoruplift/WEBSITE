// Operator Uplift Memory Engine
// Inspired by Claude Code's 3-layer memory architecture
// Index → Topic Files → Raw Data (never read, only searched)

export interface MemoryEntry {
  id: string;
  name: string;
  description: string; // one-line, used for relevance matching
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

const MEMORY_INDEX_KEY = 'ou-memory-index';
const MEMORY_ENTRIES_KEY = 'ou-memory-entries';
const MAX_INDEX_ENTRIES = 200; // matches Claude Code's 200-line cap

// --- Layer 1: Index (always loaded) ---

export function getMemoryIndex(): MemoryIndex {
  try {
    const raw = localStorage.getItem(MEMORY_INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fresh start */ }
  return { version: 1, entries: [], lastConsolidated: new Date().toISOString() };
}

function saveMemoryIndex(index: MemoryIndex): void {
  // Enforce cap: truncate if over MAX_INDEX_ENTRIES
  if (index.entries.length > MAX_INDEX_ENTRIES) {
    index.entries = index.entries.slice(0, MAX_INDEX_ENTRIES);
  }
  localStorage.setItem(MEMORY_INDEX_KEY, JSON.stringify(index));
}

// --- Layer 2: Topic Files (on-demand) ---

export function getAllEntries(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(MEMORY_ENTRIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fresh start */ }
  return [];
}

function saveAllEntries(entries: MemoryEntry[]): void {
  localStorage.setItem(MEMORY_ENTRIES_KEY, JSON.stringify(entries));
}

// --- CRUD Operations ---

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

  // Step 1: Write to topic files
  const entries = getAllEntries();
  entries.push(newEntry);
  saveAllEntries(entries);

  // Step 2: Update index (pointer only)
  const index = getMemoryIndex();
  index.entries.push({
    id: newEntry.id,
    name: newEntry.name,
    description: newEntry.description,
    type: newEntry.type,
  });
  saveMemoryIndex(index);

  return newEntry;
}

export function getMemory(id: string): MemoryEntry | null {
  const entries = getAllEntries();
  const entry = entries.find(e => e.id === id);
  if (entry) {
    // Track access
    entry.accessCount++;
    entry.lastAccessed = new Date().toISOString();
    saveAllEntries(entries);
  }
  return entry || null;
}

export function updateMemory(id: string, updates: Partial<Pick<MemoryEntry, 'name' | 'description' | 'content' | 'tags' | 'type'>>): MemoryEntry | null {
  const entries = getAllEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;

  entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
  saveAllEntries(entries);

  // Update index too
  const index = getMemoryIndex();
  const indexEntry = index.entries.find(e => e.id === id);
  if (indexEntry) {
    if (updates.name) indexEntry.name = updates.name;
    if (updates.description) indexEntry.description = updates.description;
    if (updates.type) indexEntry.type = updates.type;
    saveMemoryIndex(index);
  }

  return entries[idx];
}

export function deleteMemory(id: string): boolean {
  const entries = getAllEntries();
  const filtered = entries.filter(e => e.id !== id);
  if (filtered.length === entries.length) return false;
  saveAllEntries(filtered);

  // Remove from index
  const index = getMemoryIndex();
  index.entries = index.entries.filter(e => e.id !== id);
  saveMemoryIndex(index);

  return true;
}

// --- Layer 3: Search (grep-like, never read full data) ---

export function searchMemory(query: string): MemoryEntry[] {
  const entries = getAllEntries();
  const lower = query.toLowerCase();
  return entries.filter(e =>
    e.name.toLowerCase().includes(lower) ||
    e.description.toLowerCase().includes(lower) ||
    e.content.toLowerCase().includes(lower) ||
    e.tags.some(t => t.toLowerCase().includes(lower))
  ).sort((a, b) => b.accessCount - a.accessCount); // most accessed first
}

// --- Memory Consolidation (background self-healing) ---

export function consolidateMemory(): { merged: number; removed: number } {
  const entries = getAllEntries();
  let merged = 0;
  let removed = 0;

  // 1. Remove duplicates (same name + type)
  const seen = new Map<string, MemoryEntry>();
  const deduped: MemoryEntry[] = [];
  for (const entry of entries) {
    const key = `${entry.type}:${entry.name.toLowerCase()}`;
    if (seen.has(key)) {
      // Merge: keep the one with more content, combine tags
      const existing = seen.get(key)!;
      if (entry.content.length > existing.content.length) {
        existing.content = entry.content;
      }
      existing.tags = [...new Set([...existing.tags, ...entry.tags])];
      existing.accessCount += entry.accessCount;
      existing.updatedAt = new Date().toISOString();
      merged++;
    } else {
      seen.set(key, entry);
      deduped.push(entry);
    }
  }

  // 2. Remove stale entries (not accessed in 30 days, low access count)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const active = deduped.filter(e => {
    if (e.lastAccessed > thirtyDaysAgo) return true;
    if (e.accessCount > 5) return true; // keep frequently accessed even if stale
    removed++;
    return false;
  });

  // 3. Save cleaned data
  saveAllEntries(active);

  // 4. Rebuild index from entries
  const index = getMemoryIndex();
  index.entries = active.map(e => ({
    id: e.id,
    name: e.name,
    description: e.description,
    type: e.type,
  }));
  index.lastConsolidated = new Date().toISOString();
  saveMemoryIndex(index);

  return { merged, removed };
}

// --- Context Builder (for LLM system prompts) ---

export function buildMemoryContext(query?: string): string {
  const index = getMemoryIndex();
  if (index.entries.length === 0) return '';

  let relevant: MemoryEntry[];
  if (query) {
    relevant = searchMemory(query).slice(0, 10);
  } else {
    // Get most recently accessed
    relevant = getAllEntries()
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 10);
  }

  if (relevant.length === 0) return '';

  const lines = relevant.map(e =>
    `[${e.type}] ${e.name}: ${e.description}`
  );

  return `\n\n--- Memory Context ---\n${lines.join('\n')}\n--- End Memory ---`;
}

// --- Memory Types (matching Claude Code's types) ---

export const MEMORY_TYPES = [
  { id: 'user', label: 'User', description: 'Information about the user (role, preferences, knowledge)' },
  { id: 'feedback', label: 'Feedback', description: 'Corrections and guidance for agent behavior' },
  { id: 'project', label: 'Project', description: 'Ongoing work, goals, deadlines, decisions' },
  { id: 'reference', label: 'Reference', description: 'Pointers to external resources (URLs, docs, tools)' },
  { id: 'agent', label: 'Agent', description: 'Agent-specific knowledge, configs, learned behaviors' },
];
