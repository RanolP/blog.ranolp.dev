import { promises as fs } from 'fs';
import path from 'path';
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
    return v.parse(PostSchema, parsedData);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Writes a post to a JSON file with pretty formatting and sorted keys
 * This operation is idempotent since it receives the ID
 * @param post - The post to write
 */
export async function writePost(post: Post): Promise<void> {
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
