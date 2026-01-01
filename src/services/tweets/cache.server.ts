'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Tweet } from 'react-tweet/api';

const TWEET_CACHE_DIR = path.join(process.cwd(), 'data', 'cache', 'tweet');

/**
 * Ensures the tweet cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(TWEET_CACHE_DIR, { recursive: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Gets the file path for a cached tweet
 * @param tweetId - The tweet ID
 * @returns The file path for the cached tweet
 */
function getCachePath(tweetId: string): string {
  return path.join(TWEET_CACHE_DIR, `${tweetId}.json`);
}

/**
 * Gets a cached tweet by ID
 * @param tweetId - The tweet ID
 * @returns The cached tweet data or null if not found
 */
export async function getCachedTweet(
  tweetId: string,
): Promise<Tweet | undefined> {
  try {
    const cachePath = getCachePath(tweetId);
    const content = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(content) as Tweet;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

/**
 * Caches a tweet by ID
 * @param tweetId - The tweet ID
 * @param tweet - The tweet data to cache
 */
export async function cacheTweet(tweetId: string, tweet: Tweet): Promise<void> {
  await ensureCacheDir();
  const cachePath = getCachePath(tweetId);
  const content = JSON.stringify(tweet, null, 2);
  await fs.writeFile(cachePath, content, 'utf-8');
}

/**
 * Removes a cached tweet by ID
 * @param tweetId - The tweet ID
 */
export async function removeCachedTweet(tweetId: string): Promise<void> {
  try {
    const cachePath = getCachePath(tweetId);
    await fs.unlink(cachePath);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // Already removed, ignore
      return;
    }
    throw error;
  }
}
