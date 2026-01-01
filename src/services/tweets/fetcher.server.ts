'use server';

import type { JSONContent } from '@tiptap/core';
import type { Tweet } from 'react-tweet/api';
import { getTweet, fetchTweet } from 'react-tweet/api';
import { findTweetIds } from '~/features/tiptap/extensions/twitter-embed/utils';
import { getCachedTweet, cacheTweet, removeCachedTweet } from './cache.server';
import type { TweetIndex } from '~/features/tiptap/extensions/twitter-embed/context';

/**
 * Fetches a single tweet, using cache if available
 */
async function fetchSingleTweet(tweetId: string): Promise<Tweet | null> {
  // Check cache first
  const cachedTweet = await getCachedTweet(tweetId);
  if (cachedTweet) {
    return cachedTweet;
  }

  try {
    // Fetch tweet from Twitter API
    const { data, tombstone, notFound } = await fetchTweet(tweetId);

    if (data) {
      // Cache the tweet
      await cacheTweet(tweetId, data);
      return data;
    }

    if (tombstone || notFound) {
      // Remove from cache if it was cached before
      await removeCachedTweet(tweetId);
      return null;
    }

    // Fallback: try getTweet
    const tweet = await getTweet(tweetId);
    if (tweet) {
      await cacheTweet(tweetId, tweet);
      return tweet;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching tweet ${tweetId}:`, error);
    // Try to return cached version even if fetch failed
    const cachedTweet = await getCachedTweet(tweetId);
    return cachedTweet ?? null;
  }
}

/**
 * Fetches all tweets from JSONContent and returns a TweetIndex
 * This should be called in the loader to pre-fetch tweet data
 */
export async function fetchTweetsFromContent(
  content: JSONContent,
): Promise<TweetIndex> {
  const tweetIds = findTweetIds(content);

  if (tweetIds.length === 0) {
    return {};
  }

  const tweets = await Promise.all(
    tweetIds.map(async (tweetId) => {
      const tweet = await fetchSingleTweet(tweetId);
      return [tweetId, tweet] as const;
    }),
  );

  const tweetIndex: TweetIndex = {};
  for (const [tweetId, tweet] of tweets) {
    if (tweet) {
      tweetIndex[tweetId] = tweet;
    }
  }

  return tweetIndex;
}
