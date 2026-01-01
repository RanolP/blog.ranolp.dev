'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import * as v from 'valibot';
import { PostSchema, type Post } from './types';

const POSTS_DIR = path.join(process.cwd(), 'data', 'posts');

/**
 * Lists all posts by reading the data/posts directory
 * @returns Array of post IDs (filenames without .json extension)
 */
export async function listPosts(): Promise<string[]> {
  try {
    const files = await fs.readdir(POSTS_DIR);
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));
  } catch (error) {
    // If directory doesn't exist, return empty array
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Gets a post by ID by reading and parsing its JSON file
 * @param id - The post ID (filename without .json extension)
 * @returns The parsed Post object
 */
export async function getPostById(id: string): Promise<Post | null> {
  try {
    const filePath = path.join(POSTS_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsedData = JSON.parse(content);

    // Try to parse with schema, return null if validation fails (e.g., old format)
    const result = v.safeParse(PostSchema, parsedData);
    if (!result.success) {
      console.warn(`Post ${id} failed validation, skipping:`, result.issues);
      return null;
    }

    return result.output;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    // For other errors (like JSON parse errors), log and return null
    console.warn(`Error reading post ${id}:`, error);
    return null;
  }
}

/**
 * Gets all posts from the repository
 * @returns Array of all valid Post objects
 */
export async function getAllPosts(): Promise<Post[]> {
  try {
    const postIds = await listPosts();
    const posts = await Promise.all(postIds.map((id) => getPostById(id)));
    return posts.filter((post): post is Post => post !== null);
  } catch (error) {
    console.error('Error getting all posts:', error);
    return [];
  }
}

/**
 * Gets only published posts (posts where publishedAt is not null)
 * @returns Array of published Post objects
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.metadata.publishedAt !== null);
}

/**
 * Sorts posts by date (published date for published posts, lastModifiedAt for drafts)
 * Newest first
 * @param posts - Array of posts to sort
 * @returns Sorted array of posts
 */
export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const aDate = a.metadata.publishedAt ?? a.metadata.lastModifiedAt;
    const bDate = b.metadata.publishedAt ?? b.metadata.lastModifiedAt;
    return bDate - aDate; // Unix timestamps are already in seconds, can compare directly
  });
}

/**
 * Gets posts for listing (published only in production, all in dev mode)
 * Sorted by date (newest first)
 * @returns Array of Post objects ready for display
 */
export async function getPostsForListing(): Promise<Post[]> {
  const posts = import.meta.env.DEV
    ? await getAllPosts()
    : await getPublishedPosts();
  return sortPostsByDate(posts);
}

/**
 * Gets a post by slug by searching through all posts
 * @param slug - The post slug
 * @returns The parsed Post object or null if not found
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const posts = await getAllPosts();
    const post = posts.find((p) => p.slug === slug);
    return post ?? null;
  } catch (error) {
    console.error('Error getting post by slug:', error);
    return null;
  }
}

/**
 * Writes a post to a JSON file with pretty formatting and sorted keys
 * This operation is idempotent since it receives the ID
 * @param post - The post to write
 */
export async function writePost(post: Post): Promise<void> {
  console.log('Writing post:', post.content);
  // Validate the post data before writing
  v.parse(PostSchema, post);

  // Ensure the posts directory exists
  await fs.mkdir(POSTS_DIR, { recursive: true });

  const filePath = path.join(POSTS_DIR, `${post.id}.json`);

  // Custom replacer to sort object keys
  const sortedStringify = (obj: any): string => {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      return JSON.stringify(
        obj.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return JSON.parse(sortedStringify(item));
          }
          return item;
        }),
        null,
        2,
      );
    }

    const sortedObj: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sortedObj[key] = obj[key];
      });

    return JSON.stringify(sortedObj, null, 2);
  };

  const content = sortedStringify(post);
  await fs.writeFile(filePath, content, 'utf-8');
}
