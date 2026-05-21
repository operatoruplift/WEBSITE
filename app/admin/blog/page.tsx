import Link from 'next/link';
import { posts } from '@/app/blog/posts';

export const dynamic = 'force-dynamic';

/**
 * Admin blog manager (read-only v1).
 *
 * Today posts live in two places:
 *   - app/blog/posts.ts (metadata: id, title, excerpt, date, category)
 *   - app/blog/[id]/page.tsx (article bodies, inlined TSX)
 *
 * A real CMS would move both into a Supabase posts table with an editor
 * here. That ships as a follow-up (needs a schema migration + write
 * API + form). v1 below just lists everything so the operator can:
 *   - See the full inventory at a glance
 *   - Click through to view the live post
 *   - Open the source file path to edit + redeploy
 *
 * Until the editor ships, edits are still source-of-truth in the
 * repo (PR + deploy), not the dashboard.
 */
export default function AdminBlogPage() {
    const sorted = [...posts].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
                <p className="text-sm text-muted mt-1">
                    {sorted.length} posts. Sorted newest first. Edits today require a PR to <code className="font-mono">app/blog/posts.ts</code> + <code className="font-mono">app/blog/[id]/page.tsx</code>; in-place editor is the next thing to ship here.
                </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">Read-only v1</p>
                <p className="mt-1">
                    The Supabase-backed editor is queued. Until it lands, use the source paths shown next to each row.
                </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-foreground/10">
                <table className="min-w-full text-sm">
                    <thead className="bg-foreground/[0.02]">
                        <tr className="text-left text-xs uppercase tracking-wider text-muted">
                            <th className="px-4 py-3 font-medium">Title</th>
                            <th className="px-4 py-3 font-medium">Category</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Featured</th>
                            <th className="px-4 py-3 font-medium">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/10">
                        {sorted.map((post) => (
                            <tr key={post.id} className="hover:bg-foreground/[0.02]">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-foreground">{post.title}</div>
                                    <div className="text-xs text-muted font-mono mt-1">{post.id}</div>
                                </td>
                                <td className="px-4 py-3 text-muted capitalize">{post.category}</td>
                                <td className="px-4 py-3 text-muted">{post.date}</td>
                                <td className="px-4 py-3 text-muted">{post.featured ? 'yes' : 'no'}</td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/blog/${post.id}`}
                                        className="text-xs underline text-foreground/70 hover:text-foreground"
                                        target="_blank"
                                    >
                                        Open
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
