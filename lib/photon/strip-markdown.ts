/**
 * stripMarkdown , removes the markdown syntax that the Anthropic
 * model occasionally emits, so the iMessage user sees plain text.
 *
 * Why we need this even though the system prompt says "no markdown":
 * Models inconsistently honor that instruction, especially when
 * they're recalling code or quoting. iMessage doesn't render
 * markdown, so backticks, asterisks, and underscores show up as
 * literal characters and look broken next to native message text.
 *
 * Conservative ruleset, only strips when the result still parses
 * to the original meaning:
 *   - ``` fences and inline `code` , drop the backticks, keep the
 *     code text (often a tiny snippet that's still useful in plain).
 *   - **bold**, *italic*, __bold__, _italic_ , drop the markers.
 *   - [text](url) , replaced with "text (url)" so the user still
 *     sees both.
 *   - ![alt](url) , replaced with "[image] url".
 *   - leading "# ", "## ", etc , dropped.
 *   - leading "- ", "* ", "1. " list bullets , dropped.
 *
 * Newlines are preserved. Whitespace runs are not collapsed.
 */
export function stripMarkdown(input: string): string {
    if (!input) return '';
    let s = input;

    // 1) Strip fenced code blocks: keep the code body, drop the
    //    ```lang opener and ``` closer. Preserves embedded newlines.
    s = s.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, (_m, body: string) => body.trim());

    // 2) Inline code: `foo` -> foo. Match a single non-greedy run
    //    so we don't span paragraphs.
    s = s.replace(/`([^`\n]+)`/g, '$1');

    // 3) Image: ![alt](url) -> [image] url
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '[image] $2');

    // 4) Link: [text](url) -> text (url). If the text is the URL
    //    itself just drop the markdown wrapper.
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
        if (text.trim() === url.trim()) return url;
        return `${text} (${url})`;
    });

    // 5) Bold/italic: **x**, __x__, *x*, _x_. Order matters: pull
    //    the doubled forms first so single-char fallbacks don't eat
    //    the second marker.
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '$1');
    s = s.replace(/__([^_\n]+)__/g, '$1');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,!?)]|$)/g, '$1$2');
    s = s.replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,!?)]|$)/g, '$1$2');

    // 6) Headings: leading "#" through "######" plus any whitespace.
    s = s.replace(/^#{1,6}\s+/gm, '');

    // 7) Bullet markers + numbered lists at line start.
    s = s.replace(/^\s*[-*+]\s+/gm, '');
    s = s.replace(/^\s*\d+\.\s+/gm, '');

    // 8) Blockquote markers.
    s = s.replace(/^>\s?/gm, '');

    return s;
}
