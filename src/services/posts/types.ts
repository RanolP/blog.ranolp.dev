import * as v from 'valibot';

export const PostSchema = v.object({
  id: v.string(),
  title: v.string(),
  content: v.string(),
  excerpt: v.optional(v.string()),
  publishedAt: v.string(),
  updatedAt: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  slug: v.string(),
  status: v.picklist(['draft', 'published']),
});

export type Post = v.InferOutput<typeof PostSchema>;
