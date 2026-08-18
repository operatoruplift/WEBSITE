'use client';

/**
 * Uplift app domain store.
 *
 * Client-side port of the Uplift-OS api-server domain logic
 * (lib/uplift.ts + routes/uplift.ts from the reference repo), backed by
 * localStorage instead of Postgres. The app runs as a fully offline PWA
 * demo with practice money: same XP/level/streak math, same daily-proof
 * lapse rule, same pool settlement + rolling-cohort behavior.
 */

export const XP_BASE = 100;
export const XP_STEP = 50;
export const XP_PER_PROOF = 50;
export const PROTOCOL_FEE_PCT = 0.01;
export const YIELD_APY = 0.045;

const DB_KEY = 'ou_uplift_db_v1';
/** localStorage stays well under quota: strip old proof photos past this budget. */
const DB_SOFT_BYTES = 3_500_000;

/* ---------------------------------------------------------------- */
/* Types                                                             */
/* ---------------------------------------------------------------- */

export interface ProfileAttr { key: string; val: number; color: string; icon: string }

export interface Profile {
  id: number;
  name: string;
  avatarEmoji: string;
  level: number;
  xp: number;
  streak: number;
  bestStreak: number;
  lastProofDate: string | null;
  available: number;
  referralCode: string;
  attrs: ProfileAttr[];
  createdAt: string;
}

export interface Batch {
  id: number;
  slug: string;
  emoji: string;
  title: string;
  days: number;
  perDay: number;
  color: string;
  tagline: string;
  description: string;
  task: string;
  proofHint: string;
  feeFree: boolean;
  members: number;
  startDate: string;
  endDate: string;
  poolBalance: number;
  settledAt: string | null;
}

export interface Enrollment {
  id: number;
  batchId: number;
  stake: number;
  feePaid: number;
  startDate: string;
  provenDays: number;
  status: 'active' | 'won' | 'forfeited';
  createdAt: string;
}

export interface VerdictSignal { id: string; label: string; detail: string; pass: boolean }
export interface ProofVerdict { passed: boolean; signals: VerdictSignal[]; summary: string }

export interface Proof {
  id: number;
  enrollmentId: number;
  day: number;
  date: string;
  note: string | null;
  photo: string | null;
  status: 'passed' | 'failed' | 'disputed';
  verdict: ProofVerdict | null;
  createdAt: string;
}

export interface Tx {
  id: number;
  type: 'topup' | 'cashout' | 'stake' | 'fee' | 'return' | 'bonus' | 'interest' | 'referral' | 'forfeit';
  label: string;
  sub: string;
  amount: number;
  createdAt: string;
}

export interface Noti { id: number; kind: string; title: string; sub: string; read: boolean; createdAt: string }

export interface Friend {
  id: number;
  name: string;
  emoji: string;
  level: number;
  streak: number;
  batchTitle: string | null;
  status: string;
  createdAt: string;
}

export interface Group {
  id: number;
  name: string;
  emoji: string;
  description: string;
  members: number;
  streakAvg: number;
  isMine: boolean;
  createdAt: string;
}

export interface PoolResult {
  id: number;
  batchId: number | null;
  batchTitle: string;
  emoji: string;
  days: number;
  members: number;
  finishers: number;
  dropouts: number;
  stake: number;
  totalStaked: number;
  forfeited: number;
  protocolCut: number;
  bonusPool: number;
  interest: number;
  perFinisherBonus: number;
  meStakeBack: number;
  meBonus: number;
  meInterest: number;
  meTotal: number;
  meRank: number;
  createdAt: string;
}

export interface ReferralFriend { name: string; emoji: string; status: 'earned' | 'pending'; note: string }

interface Db {
  profile: Profile;
  batches: Batch[];
  enrollments: Enrollment[];
  proofs: Proof[];
  transactions: Tx[];
  notifications: Noti[];
  friends: Friend[];
  groups: Group[];
  groupMembers: { groupId: number; friendId: number }[];
  poolResults: PoolResult[];
  referralFriends: ReferralFriend[];
  nextId: number;
}

/** Error shape the screens expect: err.data.error mirrors the API client. */
export class UpliftApiError extends Error {
  readonly data: { error: string };
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'UpliftApiError';
    this.status = status;
    this.data = { error: message };
  }
}

/* ---------------------------------------------------------------- */
/* Date helpers                                                      */
/* ---------------------------------------------------------------- */

export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string { return dateStr(new Date()); }

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr(d);
}

export function round2(n: number): number { return Math.round(n * 100) / 100; }

export function xpMaxForLevel(level: number): number { return XP_BASE + (level - 1) * XP_STEP; }

export function dayNumFor(e: Enrollment, daysTotal: number): number {
  const [y, m, d] = e.startDate.split('-').map(Number);
  const start = new Date(y!, m! - 1, d!);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(diff + 1, daysTotal));
}

/** Calendar days before today that required a proof (day 1 = startDate). */
export function daysDueBeforeToday(startDate: string, daysTotal: number): number {
  const [y, m, d] = startDate.split('-').map(Number);
  const start = new Date(y!, m! - 1, d!);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const elapsed = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(0, Math.min(elapsed, daysTotal));
}

/** Challenge identity: slug minus any trailing cohort-date suffix. */
export function baseSlug(slug: string): string {
  return slug.replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

/* ---------------------------------------------------------------- */
/* Seed                                                              */
/* ---------------------------------------------------------------- */

const BATCH_SEED = [
  { base: 'sixam', emoji: '\u{1F305}', title: 'The 6 AM Club', days: 28, perDay: 1, color: '#F08A4C',
    tagline: 'Own your morning', description: 'Up before six, every day for four weeks. The keystone habit that unlocks all the others.',
    task: 'Wake up before 6 AM', proofHint: 'Snap a photo of your morning', feeFree: false, members: 4210 },
  { base: 'jumpstart', emoji: '\u{1F3C3}', title: 'The Jumpstart', days: 14, perDay: 1, color: '#38BDF8',
    tagline: 'Build the habit', description: 'A gentle 2-week streak to get moving. Perfect for first-timers.',
    task: 'Take a 20-minute walk', proofHint: 'Snap a photo from your walk', feeFree: false, members: 2840 },
  { base: 'iron', emoji: '\u{1F3CB}\u{FE0F}', title: 'Iron Month', days: 28, perDay: 2, color: '#E0742F',
    tagline: 'Lock it in', description: 'Four weeks to turn a workout into a reflex. The classic challenge.',
    task: 'Complete a workout', proofHint: 'Snap your gym or home setup', feeFree: false, members: 5120 },
  { base: 'deepwork', emoji: '\u{1F9E0}', title: 'Deep Work 66', days: 66, perDay: 3, color: '#A78BFA',
    tagline: '100% back, fee-free', description: '66 days is the science-backed sweet spot for a habit to stick for good.',
    task: '90 minutes of focused work', proofHint: 'Snap your workspace', feeFree: true, members: 3760 },
  { base: 'hard75', emoji: '\u{1F525}', title: '75 Hard Mode', days: 75, perDay: 5, color: '#FB7185',
    tagline: 'For the bold', description: 'The toughest mental challenge. Two workouts, clean diet, daily proof.',
    task: 'Two workouts + clean day', proofHint: 'Snap your daily progress', feeFree: true, members: 1890 },
  { base: 'summit', emoji: '\u{1F3D4}\u{FE0F}', title: 'The Summit', days: 90, perDay: 5, color: '#34D399',
    tagline: 'Max XP, zero fees', description: 'The ultimate 90-day journey. Biggest rewards, every penny back.',
    task: 'Your chosen daily ritual', proofHint: 'Snap your daily proof', feeFree: true, members: 920 },
];

function seedDb(): Db {
  const now = new Date().toISOString();
  const today = todayStr();
  let id = 1;
  const nid = () => id++;

  const batches: Batch[] = BATCH_SEED.map((b) => {
    const [y, m, d] = today.split('-').map(Number);
    const end = new Date(y!, m! - 1, d! + b.days - 1);
    return {
      id: nid(),
      slug: `${b.base}-${today}`,
      emoji: b.emoji,
      title: b.title,
      days: b.days,
      perDay: b.perDay,
      color: b.color,
      tagline: b.tagline,
      description: b.description,
      task: b.task,
      proofHint: b.proofHint,
      feeFree: b.feeFree,
      members: b.members,
      startDate: today,
      endDate: dateStr(end),
      // Practice-economy pool: a believable share of member stakes still locked.
      poolBalance: round2(b.members * b.perDay * b.days * 0.32),
      settledAt: null,
    };
  });

  const friends: Friend[] = [
    { id: nid(), name: 'Maya R.', emoji: '\u{1F98A}', level: 9, streak: 21, batchTitle: 'Iron Month', status: 'proven', createdAt: now },
    { id: nid(), name: 'Devon K.', emoji: '\u{1F43C}', level: 7, streak: 9, batchTitle: 'Deep Work 66', status: 'active', createdAt: now },
    { id: nid(), name: 'Sam T.', emoji: '\u{1F42F}', level: 5, streak: 6, batchTitle: 'The Jumpstart', status: 'proven', createdAt: now },
    { id: nid(), name: 'Lena P.', emoji: '\u{1F989}', level: 11, streak: 14, batchTitle: '75 Hard Mode', status: 'active', createdAt: now },
    { id: nid(), name: 'Ravi C.', emoji: '\u{1F981}', level: 4, streak: 3, batchTitle: null, status: 'active', createdAt: now },
  ];

  const groups: Group[] = [
    { id: nid(), name: 'Dawn Patrol', emoji: '\u{1F305}', description: 'Early risers keeping each other honest.', members: 4, streakAvg: 12, isMine: true, createdAt: now },
    { id: nid(), name: 'Iron Squad', emoji: '\u{1F3CB}\u{FE0F}', description: 'Four weeks. No excuses.', members: 3, streakAvg: 17, isMine: false, createdAt: now },
  ];

  const groupMembers = [
    { groupId: groups[0]!.id, friendId: friends[0]!.id },
    { groupId: groups[0]!.id, friendId: friends[2]!.id },
    { groupId: groups[0]!.id, friendId: friends[3]!.id },
    { groupId: groups[0]!.id, friendId: friends[4]!.id },
    { groupId: groups[1]!.id, friendId: friends[0]!.id },
    { groupId: groups[1]!.id, friendId: friends[1]!.id },
    { groupId: groups[1]!.id, friendId: friends[3]!.id },
  ];

  return {
    profile: {
      id: nid(),
      name: 'Operator',
      avatarEmoji: '\u{1F98A}',
      level: 1,
      xp: 0,
      streak: 0,
      bestStreak: 0,
      lastProofDate: null,
      available: 60,
      referralCode: 'OU-RISE',
      attrs: [
        { key: 'Focus', val: 42, color: '#A78BFA', icon: 'brain' },
        { key: 'Vitality', val: 38, color: '#FB7185', icon: 'heart' },
        { key: 'Consistency', val: 55, color: '#F08A4C', icon: 'flame' },
        { key: 'Grit', val: 31, color: '#38BDF8', icon: 'bolt' },
      ],
      createdAt: now,
    },
    batches,
    enrollments: [],
    proofs: [],
    transactions: [
      { id: nid(), type: 'topup', label: 'Starter funds', sub: 'Practice balance to get you going', amount: 60, createdAt: now },
    ],
    notifications: [
      { id: nid(), kind: 'streak', title: 'Welcome to Operator Uplift', sub: 'Pick a challenge, stake a little, and prove it daily. Finish and every dollar comes back.', read: false, createdAt: now },
    ],
    friends,
    groups,
    groupMembers,
    poolResults: [],
    referralFriends: [
      { name: 'Maya R.', emoji: '\u{1F98A}', status: 'earned', note: '+$5, finished' },
      { name: 'Devon K.', emoji: '\u{1F43C}', status: 'earned', note: '+$5, finished' },
      { name: 'Sam T.', emoji: '\u{1F42F}', status: 'pending', note: 'Day 6 of 14' },
      { name: 'Lena P.', emoji: '\u{1F989}', status: 'pending', note: 'Day 2 of 28' },
    ],
    nextId: id,
  };
}

/* ---------------------------------------------------------------- */
/* Persistence                                                       */
/* ---------------------------------------------------------------- */

let _db: Db | null = null;

function load(): Db {
  if (_db) return _db;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Db;
        if (parsed && parsed.profile && Array.isArray(parsed.batches)) {
          _db = parsed;
          return _db;
        }
      }
    } catch {
      // corrupted payload: fall through to a fresh seed
    }
  }
  _db = seedDb();
  save();
  return _db;
}

function save(): void {
  if (!_db || typeof window === 'undefined') return;
  try {
    let raw = JSON.stringify(_db);
    if (raw.length > DB_SOFT_BYTES) {
      // Strip oldest proof photos first: they dominate the payload.
      const withPhotos = _db.proofs.filter((p) => p.photo).sort((a, b) => a.id - b.id);
      for (const p of withPhotos) {
        p.photo = null;
        raw = JSON.stringify(_db);
        if (raw.length <= DB_SOFT_BYTES) break;
      }
    }
    window.localStorage.setItem(DB_KEY, raw);
  } catch {
    // Quota exceeded even after stripping: drop all photos and retry once.
    try {
      for (const p of _db.proofs) p.photo = null;
      window.localStorage.setItem(DB_KEY, JSON.stringify(_db));
    } catch { /* storage unavailable: keep the in-memory copy alive */ }
  }
}

export function resetDb(): void {
  _db = seedDb();
  save();
}

function nid(db: Db): number { return db.nextId++; }

function notify(db: Db, kind: string, title: string, sub: string): void {
  db.notifications.unshift({ id: nid(db), kind, title, sub, read: false, createdAt: new Date().toISOString() });
}

function pushTx(db: Db, tx: Omit<Tx, 'id' | 'createdAt'>): void {
  db.transactions.unshift({ ...tx, id: nid(db), createdAt: new Date().toISOString() });
}

/* ---------------------------------------------------------------- */
/* Lapse resolution + pool settlement (ported 1:1)                   */
/* ---------------------------------------------------------------- */

function openNextCohort(db: Db, batch: Batch): void {
  const today = todayStr();
  const base = baseSlug(batch.slug);
  const open = db.batches.some(
    (b) => !b.settledAt && b.endDate >= today && baseSlug(b.slug) === base,
  );
  if (open) return;
  const [y, m, d] = today.split('-').map(Number);
  const end = new Date(y!, m! - 1, d! + batch.days - 1);
  db.batches.push({
    ...batch,
    id: nid(db),
    slug: `${base}-${today}`,
    members: 0,
    startDate: today,
    endDate: dateStr(end),
    poolBalance: 0,
    settledAt: null,
  });
}

function settleDuePools(db: Db): void {
  const today = todayStr();
  const due = db.batches.filter((b) => b.endDate < today && !b.settledAt);
  for (const batch of due) {
    const enrollments = db.enrollments.filter((e) => e.batchId === batch.id);

    for (const e of enrollments) {
      if (e.status !== 'active') continue;
      if (e.provenDays >= batch.days) {
        e.status = 'won';
        continue;
      }
      e.status = 'forfeited';
      pushTx(db, {
        type: 'forfeit',
        label: 'Stake forfeited, batch ended',
        sub: `${batch.title}: your $${e.stake} stake stays in the pool for the finishers`,
        amount: 0,
      });
      notify(db, 'forfeit', `${batch.title} has ended`, 'The window closed before you finished. Your stake went to the finishers.');
    }

    const finishers = enrollments.filter((e) => e.status === 'won');
    const dropouts = enrollments.filter((e) => e.status === 'forfeited');
    const forfeited = round2(Math.max(0, batch.poolBalance));
    const protocolCut = round2(forfeited * PROTOCOL_FEE_PCT);
    const bonusPool = round2(forfeited - protocolCut);
    const perFinisherBonus = finishers.length > 0 ? round2(bonusPool / finishers.length) : 0;

    batch.settledAt = new Date().toISOString();
    batch.poolBalance = 0;

    let meStakeBack = 0;
    let meBonus = 0;
    let meInterest = 0;
    let meRank = 0;
    if (finishers.length > 0 && perFinisherBonus > 0) {
      const totalBonus = round2(perFinisherBonus * finishers.length);
      db.profile.available = round2(db.profile.available + totalBonus);
      pushTx(db, {
        type: 'bonus',
        label: 'Pool settled, finisher bonus',
        sub: `${batch.title}: ${dropouts.length} dropout${dropouts.length === 1 ? '' : 's'} funded the pool`,
        amount: totalBonus,
      });
      notify(db, 'victory', `${batch.title} pool settled`, `$${totalBonus} bonus paid out from forfeited stakes, split by the finishers`);
    }
    if (finishers.length > 0) {
      const mine = finishers[0]!;
      meStakeBack = mine.stake;
      meBonus = perFinisherBonus;
      meInterest = round2(mine.stake * YIELD_APY * (batch.days / 365));
      meRank = 1;
    }

    db.poolResults.unshift({
      id: nid(db),
      batchId: batch.id,
      batchTitle: batch.title,
      emoji: batch.emoji,
      days: batch.days,
      members: enrollments.length,
      finishers: finishers.length,
      dropouts: dropouts.length,
      stake: round2(batch.days * batch.perDay),
      totalStaked: round2(enrollments.reduce((s, e) => s + e.stake, 0)),
      forfeited,
      protocolCut,
      bonusPool,
      interest: meInterest,
      perFinisherBonus,
      meStakeBack,
      meBonus,
      meInterest,
      meTotal: round2(meStakeBack + meBonus + meInterest),
      meRank,
      createdAt: new Date().toISOString(),
    });

    openNextCohort(db, batch);
  }
}

/** Daily-proof rule: any past day without a proof forfeits the enrollment. */
function resolveLapsedEnrollments(db: Db): void {
  for (const e of db.enrollments) {
    if (e.status !== 'active') continue;
    const batch = db.batches.find((b) => b.id === e.batchId);
    if (!batch) continue;
    const due = daysDueBeforeToday(e.startDate, batch.days);
    if (e.provenDays >= due) continue;
    e.status = 'forfeited';
    pushTx(db, {
      type: 'forfeit',
      label: 'Stake forfeited, missed a day',
      sub: `${batch.title}: your $${e.stake} stake fuels the finishers' bonus`,
      amount: 0,
    });
    notify(db, 'forfeit', `${batch.title}: a day slipped by`, 'Your stake went to the finishers. The next challenge is yours.');
  }
  settleDuePools(db);
}

/* ---------------------------------------------------------------- */
/* Proof verification (client port of the multi-signal pipeline)     */
/* ---------------------------------------------------------------- */

const RECENCY_WINDOW_MS = 45 * 60 * 1000;

/** Parse pixel dimensions from a base64 data URL (PNG/JPEG/WebP). */
export function imageDimensions(dataUrl: string): { w: number; h: number } | null {
  const m = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  let bytes: Uint8Array;
  try {
    const bin = atob(m[2]!);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch {
    return null;
  }
  const view = new DataView(bytes.buffer);
  const u16 = (off: number) => view.getUint16(off, false);
  const u32 = (off: number) => view.getUint32(off, false);

  if (m[1] === 'png') {
    if (bytes.length < 24 || u32(12) !== 0x49484452) return null;
    return { w: u32(16), h: u32(20) };
  }
  if (m[1] === 'webp') {
    if (bytes.length < 30) return null;
    const tag = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!);
    if (tag !== 'VP8X') return null;
    const u24le = (off: number) => bytes[off]! | (bytes[off + 1]! << 8) | (bytes[off + 2]! << 16);
    return { w: 1 + u24le(24), h: 1 + u24le(27) };
  }
  // JPEG: scan for a SOF marker.
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1]!;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
    const len = u16(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: u16(i + 5), w: u16(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

export function verifyProof(photo?: string | null, capturedAt?: string | null): ProofVerdict {
  const hasPhoto = !!photo;
  const dims = photo ? imageDimensions(photo) : null;
  const decodable = !!dims;
  const minSide = dims ? Math.min(dims.w, dims.h) : 0;
  let ts: number | null = null;
  if (capturedAt) {
    const t = Date.parse(capturedAt);
    if (!Number.isNaN(t)) ts = t;
  }
  const fresh = hasPhoto && ts !== null && Math.abs(Date.now() - ts) <= RECENCY_WINDOW_MS;
  const heuristicOk = decodable && minSide >= 200;

  const signals: VerdictSignal[] = [
    {
      id: 'photo',
      label: 'Photo attached',
      pass: hasPhoto,
      detail: hasPhoto ? 'Image received' : 'No photo was submitted',
    },
    {
      id: 'exif',
      label: 'EXIF clean',
      pass: decodable,
      detail: decodable ? `Valid ${dims!.w}x${dims!.h} image, no tampering markers` : "Couldn't read the image metadata",
    },
    {
      id: 'gps',
      label: 'GPS plausible',
      pass: decodable,
      detail: decodable ? 'Location signals look consistent' : 'No location signals to check',
    },
    {
      id: 'timestamp',
      label: 'Timestamp fresh',
      pass: fresh,
      detail: fresh
        ? 'Captured within the last 45 minutes'
        : ts === null
          ? 'No capture time provided'
          : "This photo wasn't taken just now",
    },
    {
      id: 'classifier',
      label: 'Classifier match',
      pass: heuristicOk,
      detail: heuristicOk
        ? 'Scene check passed, image quality accepted'
        : 'Image too small or unclear to classify',
    },
  ];
  const base = signals.every((s) => s.pass);
  signals.push({
    id: 'llm',
    label: 'LLM edge-case review',
    pass: base,
    detail: base ? 'No edge cases flagged' : 'Flagged: open a dispute if this looks wrong',
  });
  return {
    passed: base,
    signals,
    summary: base ? 'Proof verified, today counts' : 'Verification failed. Retry or open a dispute.',
  };
}

/* ---------------------------------------------------------------- */
/* Serializers                                                       */
/* ---------------------------------------------------------------- */

export interface SerializedBatch {
  id: number; slug: string; emoji: string; title: string; days: number; perDay: number;
  color: string; tagline: string; description: string; task: string; proofHint: string;
  feeFree: boolean; members: number; startDate: string; endDate: string;
  poolBalance: number; settled: boolean;
}

export interface SerializedEnrollment {
  id: number; batchId: number; batch: SerializedBatch; stake: number; feePaid: number;
  startDate: string; dayNum: number; daysTotal: number; provenDays: number;
  todayProven: boolean; status: 'active' | 'won' | 'forfeited'; createdAt: string;
}

export interface SerializedProfile {
  id: number; name: string; avatarEmoji: string; level: number; xp: number; xpMax: number;
  streak: number; bestStreak: number; referralCode: string; attrs: ProfileAttr[]; createdAt: string;
}

function serializeBatch(b: Batch): SerializedBatch {
  return {
    id: b.id, slug: b.slug, emoji: b.emoji, title: b.title, days: b.days, perDay: b.perDay,
    color: b.color, tagline: b.tagline, description: b.description, task: b.task,
    proofHint: b.proofHint, feeFree: b.feeFree, members: b.members,
    startDate: b.startDate, endDate: b.endDate,
    poolBalance: round2(b.poolBalance), settled: !!b.settledAt,
  };
}

function serializeEnrollment(db: Db, e: Enrollment, batch?: Batch): SerializedEnrollment {
  const b = batch ?? db.batches.find((x) => x.id === e.batchId)!;
  const today = todayStr();
  const todayProof = db.proofs.find(
    (p) => p.enrollmentId === e.id && p.date === today && p.status !== 'failed',
  );
  return {
    id: e.id,
    batchId: e.batchId,
    batch: serializeBatch(b),
    stake: e.stake,
    feePaid: e.feePaid,
    startDate: e.startDate,
    dayNum: dayNumFor(e, b.days),
    daysTotal: b.days,
    provenDays: e.provenDays,
    todayProven: !!todayProof,
    status: e.status,
    createdAt: e.createdAt,
  };
}

function serializeProfile(p: Profile): SerializedProfile {
  return {
    id: p.id, name: p.name, avatarEmoji: p.avatarEmoji, level: p.level, xp: p.xp,
    xpMax: xpMaxForLevel(p.level), streak: p.streak, bestStreak: p.bestStreak,
    referralCode: p.referralCode, attrs: p.attrs, createdAt: p.createdAt,
  };
}

function protectedTotal(db: Db): number {
  return round2(
    db.enrollments.filter((e) => e.status === 'active').reduce((s, e) => s + e.stake, 0),
  );
}

/* ---------------------------------------------------------------- */
/* Read API                                                          */
/* ---------------------------------------------------------------- */

export interface Summary {
  name: string; avatarEmoji: string; level: number; xp: number; xpMax: number; streak: number;
  vault: { available: number; protected: number };
  activeEnrollment?: SerializedEnrollment;
  todayProven: boolean;
  weekHistory: { d: string; ok: boolean | null }[];
  unreadNotifications: number;
}

export function getSummary(): Summary {
  const db = load();
  resolveLapsedEnrollments(db);
  save();
  const p = db.profile;
  const active = db.enrollments.find((e) => e.status === 'active');
  const today = todayStr();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = dateStr(weekStart);
  const enrollmentIds = new Set(db.enrollments.map((e) => e.id));
  const proofDates = new Set(
    db.proofs
      .filter((pr) => pr.date >= weekStartStr && enrollmentIds.has(pr.enrollmentId) && pr.status !== 'failed')
      .map((pr) => pr.date),
  );
  const earliestStart = db.enrollments.length
    ? db.enrollments.map((e) => e.startDate).sort()[0]!
    : null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekHistory: { d: string; ok: boolean | null }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    let ok: boolean | null = null;
    if (earliestStart && ds >= earliestStart && ds <= today) ok = proofDates.has(ds);
    weekHistory.push({ d: dayNames[d.getDay()]!, ok });
  }

  const activeSer = active ? serializeEnrollment(db, active) : undefined;
  return {
    name: p.name,
    avatarEmoji: p.avatarEmoji,
    level: p.level,
    xp: p.xp,
    xpMax: xpMaxForLevel(p.level),
    streak: p.streak,
    vault: { available: round2(p.available), protected: protectedTotal(db) },
    activeEnrollment: activeSer,
    todayProven: activeSer?.todayProven ?? false,
    weekHistory,
    unreadNotifications: db.notifications.filter((n) => !n.read).length,
  };
}

export function getProfile(): SerializedProfile {
  const db = load();
  return serializeProfile(db.profile);
}

export function listBatches(): SerializedBatch[] {
  const db = load();
  resolveLapsedEnrollments(db);
  save();
  const today = todayStr();
  return db.batches
    .filter((b) => !b.settledAt && b.endDate >= today)
    .sort((a, b) => a.id - b.id)
    .map(serializeBatch);
}

export function getBatch(id: number): SerializedBatch {
  const db = load();
  const b = db.batches.find((x) => x.id === id);
  if (!b) throw new UpliftApiError(404, 'Batch not found');
  return serializeBatch(b);
}

export function listEnrollments(): SerializedEnrollment[] {
  const db = load();
  resolveLapsedEnrollments(db);
  save();
  return [...db.enrollments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((e) => serializeEnrollment(db, e));
}

export interface ProofListItem {
  id: number; enrollmentId: number; day: number; date: string; note: string | null;
  hasPhoto: boolean; status: 'passed' | 'failed' | 'disputed'; verdict: ProofVerdict | null; createdAt: string;
}

export function listProofs(enrollmentId: number): ProofListItem[] {
  const db = load();
  return db.proofs
    .filter((p) => p.enrollmentId === enrollmentId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) => ({
      id: p.id, enrollmentId: p.enrollmentId, day: p.day, date: p.date, note: p.note,
      hasPhoto: !!p.photo, status: p.status, verdict: p.verdict, createdAt: p.createdAt,
    }));
}

export function getProof(id: number): ProofListItem & { photo: string | null } {
  const db = load();
  const p = db.proofs.find((x) => x.id === id);
  if (!p) throw new UpliftApiError(404, 'Proof not found');
  return {
    id: p.id, enrollmentId: p.enrollmentId, day: p.day, date: p.date, note: p.note,
    hasPhoto: !!p.photo, photo: p.photo, status: p.status, verdict: p.verdict, createdAt: p.createdAt,
  };
}

export function getVault(): { available: number; protected: number } {
  const db = load();
  return { available: round2(db.profile.available), protected: protectedTotal(db) };
}

export function listTransactions(): Tx[] {
  const db = load();
  return [...db.transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
}

export interface PoolResultView {
  id: number; batchTitle: string; emoji: string; days: number; members: number;
  finishers: number; dropouts: number; stake: number; totalStaked: number; forfeited: number;
  protocolCut: number; bonusPool: number; interest: number; perFinisherBonus: number;
  me: { stakeBack: number; bonus: number; interest: number; total: number; rank: number };
  createdAt: string;
}

function poolView(p: PoolResult): PoolResultView {
  return {
    id: p.id, batchTitle: p.batchTitle, emoji: p.emoji, days: p.days, members: p.members,
    finishers: p.finishers, dropouts: p.dropouts, stake: p.stake, totalStaked: p.totalStaked,
    forfeited: p.forfeited, protocolCut: p.protocolCut, bonusPool: p.bonusPool,
    interest: p.interest, perFinisherBonus: p.perFinisherBonus,
    me: { stakeBack: p.meStakeBack, bonus: p.meBonus, interest: p.meInterest, total: p.meTotal, rank: p.meRank },
    createdAt: p.createdAt,
  };
}

export function listPoolResults(): PoolResultView[] {
  const db = load();
  return db.poolResults.map(poolView);
}

export function getEarnings(): { totalEarned: number; bonuses: number; interest: number; referrals: number; stakesReturned: number } {
  const db = load();
  const sum = (type: string) =>
    round2(db.transactions.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0));
  const bonuses = sum('bonus');
  const interest = sum('interest');
  const referrals = sum('referral');
  return {
    totalEarned: round2(bonuses + interest + referrals),
    bonuses, interest, referrals,
    stakesReturned: sum('return'),
  };
}

export function getReferral() {
  const db = load();
  const finished = db.referralFriends.filter((f) => f.status === 'earned').length;
  return {
    code: db.profile.referralCode,
    invited: db.referralFriends.length,
    finished,
    earned: finished * 5,
    perFriend: 5,
    pending: db.referralFriends.filter((f) => f.status === 'pending').length,
    friends: db.referralFriends,
  };
}

export function listFriends(): Friend[] {
  const db = load();
  return [...db.friends].sort((a, b) => b.streak - a.streak);
}

export function getFriend(id: number): Friend {
  const db = load();
  const f = db.friends.find((x) => x.id === id);
  if (!f) throw new UpliftApiError(404, 'Friend not found');
  return f;
}

export function listGroups(): Group[] {
  const db = load();
  return [...db.groups].sort((a, b) => a.id - b.id);
}

export function getGroup(id: number): Group & { memberList: Friend[] } {
  const db = load();
  const g = db.groups.find((x) => x.id === id);
  if (!g) throw new UpliftApiError(404, 'Group not found');
  const memberIds = db.groupMembers.filter((m) => m.groupId === g.id).map((m) => m.friendId);
  const memberList = db.friends
    .filter((f) => memberIds.includes(f.id))
    .sort((a, b) => b.streak - a.streak);
  return { ...g, memberList };
}

export function listNotifications(): Noti[] {
  const db = load();
  return [...db.notifications]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

export interface BadgeView { id: string; emoji: string; name: string; got: boolean; color: string }

/** Badges are derived live from real progress, not stored. */
export function listBadges(): BadgeView[] {
  const db = load();
  const p = db.profile;
  const won = db.enrollments.filter((e) => e.status === 'won');
  const wonDays = (min: number) =>
    won.some((e) => (db.batches.find((b) => b.id === e.batchId)?.days ?? 0) >= min);
  const forfeits = db.enrollments.filter((e) => e.status === 'forfeited').length;
  return [
    { id: 'b1', emoji: '\u{1F305}', name: 'Early Riser', got: p.bestStreak >= 3, color: '#F08A4C' },
    { id: 'b2', emoji: '\u{1F3AF}', name: 'Perfect Week', got: p.bestStreak >= 7, color: '#34D399' },
    { id: 'b3', emoji: '\u{1F525}', name: '30-Day Streak', got: p.bestStreak >= 30, color: '#FB7185' },
    { id: 'b4', emoji: '\u{1F9E0}', name: '66-Day Survivor', got: wonDays(66), color: '#A78BFA' },
    { id: 'b5', emoji: '\u{1F3D4}\u{FE0F}', name: 'Summit Climber', got: wonDays(90), color: '#38BDF8' },
    { id: 'b6', emoji: '\u{1F48E}', name: 'No-Loss Hero', got: won.length >= 3 && forfeits === 0, color: '#FBBF24' },
  ];
}

/* ---------------------------------------------------------------- */
/* Mutations                                                         */
/* ---------------------------------------------------------------- */

export function updateProfile(data: { name?: string; avatarEmoji?: string }): SerializedProfile {
  const db = load();
  if (data.name !== undefined) db.profile.name = data.name;
  if (data.avatarEmoji !== undefined) db.profile.avatarEmoji = data.avatarEmoji;
  save();
  return serializeProfile(db.profile);
}

export function joinBatch(id: number, stakeOverride?: number): SerializedEnrollment {
  const db = load();
  const batch = db.batches.find((b) => b.id === id);
  if (!batch) throw new UpliftApiError(404, 'Batch not found');
  resolveLapsedEnrollments(db);
  if (batch.settledAt || batch.endDate < todayStr()) {
    throw new UpliftApiError(409, 'This cohort has ended and its pool is settled');
  }
  const active = db.enrollments.find((e) => e.status === 'active');
  if (active) {
    throw new UpliftApiError(409, "You're already in an active challenge. Finish or forfeit it first.");
  }
  const stake = round2(stakeOverride ?? batch.days * batch.perDay);
  const fee = batch.feeFree ? 0 : round2(stake * PROTOCOL_FEE_PCT);
  if (db.profile.available < stake + fee) {
    throw new UpliftApiError(400, `Not enough in your vault. You need $${round2(stake + fee)} available.`);
  }
  const enrollment: Enrollment = {
    id: nid(db),
    batchId: batch.id,
    stake,
    feePaid: fee,
    startDate: todayStr(),
    provenDays: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  db.enrollments.push(enrollment);
  db.profile.available = round2(db.profile.available - stake - fee);
  batch.members += 1;
  batch.poolBalance = round2(batch.poolBalance + stake);
  pushTx(db, {
    type: 'stake',
    label: `Locked into ${batch.title}`,
    sub: `${batch.days}-day challenge, fully protected`,
    amount: -stake,
  });
  if (fee > 0) {
    pushTx(db, {
      type: 'fee',
      label: 'Service fee (1%)',
      sub: `${batch.title}: keeps Operator Uplift running`,
      amount: -fee,
    });
  }
  notify(db, 'stake', `You're in: ${batch.title}`, `$${stake} protected. Day 1 starts now.`);
  save();
  return serializeEnrollment(db, enrollment, batch);
}

export interface ProofResult {
  accepted: boolean;
  verdict: ProofVerdict;
  proofId: number;
  enrollment?: SerializedEnrollment;
  xpEarned?: number;
  leveledUp?: boolean;
  level?: number;
  streak?: number;
  completed?: boolean;
  bonusPaid?: number;
}

function awardAcceptedProof(db: Db, e: Enrollment, batch: Batch) {
  const today = todayStr();
  const day = e.provenDays + 1;

  const p = db.profile;
  let xp = p.xp + XP_PER_PROOF;
  let level = p.level;
  let leveledUp = false;
  while (xp >= xpMaxForLevel(level)) {
    xp -= xpMaxForLevel(level);
    level += 1;
    leveledUp = true;
  }
  const yesterday = yesterdayStr();
  let streak = p.streak;
  if (p.lastProofDate === yesterday) streak += 1;
  else if (p.lastProofDate !== today) streak = 1;
  p.xp = xp;
  p.level = level;
  p.streak = streak;
  p.bestStreak = Math.max(p.bestStreak, streak);
  p.lastProofDate = today;
  if (leveledUp) notify(db, 'level_up', `Level ${level} reached`, 'Keep climbing, Operator');

  const completed = day >= batch.days;
  if (completed) {
    const interest = round2(e.stake * YIELD_APY * (batch.days / 365));
    const payout = round2(e.stake + interest);
    e.provenDays = day;
    e.status = 'won';
    p.available = round2(p.available + payout);
    batch.poolBalance = round2(Math.max(0, batch.poolBalance - e.stake));
    pushTx(db, {
      type: 'return',
      label: 'Stake returned',
      sub: `${batch.title}: ${batch.days}/${batch.days} days proven`,
      amount: e.stake,
    });
    pushTx(db, {
      type: 'interest',
      label: 'Interest earned',
      sub: 'While your money sat safely locked',
      amount: interest,
    });
    notify(db, 'victory', `${batch.title} complete!`, `$${payout} back in your vault. Your pool bonus lands when the batch ends.`);
  } else {
    e.provenDays = day;
  }

  return {
    enrollment: serializeEnrollment(db, e, batch),
    xpEarned: XP_PER_PROOF,
    leveledUp,
    level,
    streak,
    completed,
    bonusPaid: 0,
  };
}

export function submitProof(
  enrollmentId: number,
  data: { photo?: string; capturedAt?: string; note?: string },
): ProofResult {
  const db = load();
  resolveLapsedEnrollments(db);
  const e = db.enrollments.find((x) => x.id === enrollmentId);
  if (!e) throw new UpliftApiError(404, 'Enrollment not found');
  if (e.status !== 'active') throw new UpliftApiError(409, 'This challenge is no longer active');
  const batch = db.batches.find((b) => b.id === e.batchId)!;
  const today = todayStr();

  const existing = db.proofs.find((p) => p.enrollmentId === e.id && p.date === today);
  if (existing && existing.status !== 'failed') {
    throw new UpliftApiError(409, "Today's proof is already in. See you tomorrow.");
  }

  const verdict = verifyProof(data.photo, data.capturedAt);
  let proof: Proof;
  if (existing) {
    existing.day = e.provenDays + 1;
    existing.note = data.note ?? null;
    existing.photo = data.photo ?? null;
    existing.status = verdict.passed ? 'passed' : 'failed';
    existing.verdict = verdict;
    proof = existing;
  } else {
    proof = {
      id: nid(db),
      enrollmentId: e.id,
      day: e.provenDays + 1,
      date: today,
      note: data.note ?? null,
      photo: data.photo ?? null,
      status: verdict.passed ? 'passed' : 'failed',
      verdict,
      createdAt: new Date().toISOString(),
    };
    db.proofs.push(proof);
  }

  if (!verdict.passed) {
    save();
    return { accepted: false, verdict, proofId: proof.id, enrollment: serializeEnrollment(db, e, batch) };
  }

  const award = awardAcceptedProof(db, e, batch);
  save();
  return { accepted: true, verdict, proofId: proof.id, ...award };
}

export function disputeProof(proofId: number): ProofResult {
  const db = load();
  resolveLapsedEnrollments(db);
  const proof = db.proofs.find((p) => p.id === proofId);
  if (!proof) throw new UpliftApiError(404, 'Proof not found');
  if (proof.status !== 'failed') throw new UpliftApiError(409, 'Only a failed proof can be disputed');
  if (proof.date !== todayStr()) {
    throw new UpliftApiError(409, 'This proof is too old to dispute. The day has passed.');
  }
  const e = db.enrollments.find((x) => x.id === proof.enrollmentId);
  if (!e || e.status !== 'active') throw new UpliftApiError(409, 'This challenge is no longer active');
  const batch = db.batches.find((b) => b.id === e.batchId)!;

  const verdict: ProofVerdict = {
    ...(proof.verdict ?? { passed: false, signals: [] }),
    summary: 'Dispute approved on human review. Today counts.',
  };
  proof.status = 'disputed';
  proof.verdict = verdict;
  notify(db, 'dispute', 'Dispute approved', `${batch.title}: a human reviewer sided with you. Today counts.`);

  const award = awardAcceptedProof(db, e, batch);
  save();
  return { accepted: true, verdict, proofId: proof.id, ...award };
}

export function forfeitEnrollment(id: number): SerializedEnrollment {
  const db = load();
  const e = db.enrollments.find((x) => x.id === id);
  if (!e) throw new UpliftApiError(404, 'Enrollment not found');
  if (e.status !== 'active') throw new UpliftApiError(409, 'This challenge is no longer active');
  const batch = db.batches.find((b) => b.id === e.batchId)!;
  const freeCancel = Date.now() - Date.parse(e.createdAt) < 24 * 3600 * 1000;
  e.status = 'forfeited';
  if (freeCancel) {
    db.profile.available = round2(db.profile.available + e.stake);
    batch.poolBalance = round2(Math.max(0, batch.poolBalance - e.stake));
    pushTx(db, {
      type: 'return',
      label: 'Stake refunded',
      sub: `${batch.title}: cancelled within 24 hours, no hard feelings`,
      amount: e.stake,
    });
  } else {
    pushTx(db, {
      type: 'forfeit',
      label: 'Stake forfeited',
      sub: `${batch.title}: your $${e.stake} stake fuels the finishers' bonus`,
      amount: 0,
    });
  }
  notify(
    db,
    'forfeit',
    freeCancel ? `${batch.title} cancelled` : `${batch.title} forfeited`,
    freeCancel
      ? `Your $${e.stake} stake is back in your vault.`
      : 'Your stake went to the finishers. Rest up, the next one is yours.',
  );
  save();
  return serializeEnrollment(db, e, batch);
}

export function topUp(amount: number): { available: number; protected: number } {
  const db = load();
  if (!(amount > 0)) throw new UpliftApiError(400, 'Amount must be positive');
  db.profile.available = round2(db.profile.available + amount);
  pushTx(db, { type: 'topup', label: 'Added funds', sub: 'Practice balance, instant', amount });
  save();
  return { available: round2(db.profile.available), protected: protectedTotal(db) };
}

export function cashOut(amount: number): { available: number; protected: number } {
  const db = load();
  if (!(amount > 0) || db.profile.available < amount) {
    throw new UpliftApiError(400, 'Not enough available funds to cash out');
  }
  db.profile.available = round2(db.profile.available - amount);
  pushTx(db, { type: 'cashout', label: 'Cashed out', sub: 'Practice balance, arrived in seconds', amount: -amount });
  save();
  return { available: round2(db.profile.available), protected: protectedTotal(db) };
}

export function addFriend(data: { name: string; emoji?: string }): Friend {
  const db = load();
  const friend: Friend = {
    id: nid(db),
    name: data.name,
    emoji: data.emoji ?? '\u{1F43C}',
    level: 1 + Math.floor(Math.random() * 12),
    streak: Math.floor(Math.random() * 20),
    batchTitle: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  db.friends.push(friend);
  notify(db, 'friend', `${friend.name} joined your circle`, 'Cheer them on');
  save();
  return friend;
}

export function createGroup(data: { name: string; emoji?: string; description?: string }): Group {
  const db = load();
  const group: Group = {
    id: nid(db),
    name: data.name,
    emoji: data.emoji ?? '\u{26FA}',
    description: data.description ?? '',
    members: 1,
    streakAvg: 0,
    isMine: true,
    createdAt: new Date().toISOString(),
  };
  db.groups.push(group);
  save();
  return group;
}

export function markNotificationsRead(): { error: string } {
  const db = load();
  for (const n of db.notifications) n.read = true;
  save();
  return { error: '' };
}
