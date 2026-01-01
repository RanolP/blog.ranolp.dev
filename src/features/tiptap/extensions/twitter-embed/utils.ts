import type { JSONContent } from '@tiptap/core';

/**
 * Extracts tweet ID from a Twitter/X URL
 */
export function extractTweetId(url: string): string | null {
  const match = /\/status\/(\d+)/.exec(url);
  return match?.[1] ?? null;
}

/**
 * Recursively finds all tweet IDs in JSONContent
 */
export function findTweetIds(content: JSONContent): string[] {
  const tweetIds: string[] = [];

  function traverse(node: JSONContent): void {
    if (node.type === 'twitter') {
      const url = node.attrs?.url as string | undefined;
      if (url) {
        const tweetId = extractTweetId(url);
        if (tweetId) {
          tweetIds.push(tweetId);
        }
      }
    }

    if (node.content) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  }

  traverse(content);
  return [...new Set(tweetIds)]; // deduplicate
}
