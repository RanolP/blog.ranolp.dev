import * as v from 'valibot';
import type { JSONContent } from '@tiptap/core';

const JSONContentSchema = v.custom<JSONContent>(() => true);
/**
 * Schema for TipTap JSONContent that validates the structure
 * and ensures the first element is an h1 heading
 */
const H1HeadingSchema = v.looseObject({
  type: v.literal('heading'),
  attrs: v.object({
    level: v.literal(1),
  }),
  content: v.optional(v.array(JSONContentSchema)),
  marks: v.optional(v.array(v.any())),
});

const PostContentSchema = v.object({
  type: v.optional(v.string()),
  attrs: v.optional(v.record(v.string(), v.any())),
  content: v.tupleWithRest([H1HeadingSchema], JSONContentSchema),
});

/**
 * Extracts the title from TipTap JSONContent by finding the first h1 heading
 * @param content - The TipTap JSONContent
 * @returns The title text or empty string if not found
 */
export function extractTitleFromContent(
  content: JSONContent | null | undefined,
): string {
  // Validate content against schema
  const result = v.safeParse(PostContentSchema, content);
  if (!result.success) return '';

  const h1Content = result.output.content[0].content ?? [];
  return h1Content
    .filter((child) => child.type === 'text' && 'text' in child)
    .map((child) => (typeof child.text === 'string' ? child.text : ''))
    .join('');
}

export const PostSchema = v.object({
  id: v.string(),
  content: PostContentSchema,
  excerpt: v.optional(v.string()),
  metadata: v.object({
    publishedAt: v.nullable(v.number()),
    lastModifiedAt: v.number(),
  }),
  tags: v.optional(v.array(v.string())),
  slug: v.string(),
});

/**
 * Formats a Unix timestamp (UTC) as a local date string (yyyy-mm-dd)
 * @param timestamp - Unix timestamp in seconds (UTC)
 * @returns Formatted date string in yyyy-mm-dd format
 */
export function formatTimestampAsDate(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type Post = v.InferOutput<typeof PostSchema>;
