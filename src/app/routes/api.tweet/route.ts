import { getTweet, fetchTweet } from 'react-tweet/api';
import { getCachedTweet, cacheTweet, removeCachedTweet } from '~/services/tweets/cache.server';

/**
 * API route for fetching and caching tweets
 * GET /api/tweet?id=1234567890
 */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const tweetId = url.searchParams.get('id');

  if (!tweetId || tweetId.trim().length === 0) {
    return Response.json({ error: 'No tweet ID provided' }, { status: 400 });
  }

  // Validate tweet ID is numeric
  if (!/^\d+$/.test(tweetId)) {
    return Response.json({ error: 'Invalid tweet ID' }, { status: 400 });
  }

  try {
    // Check cache first
    const cachedTweet = await getCachedTweet(tweetId);
    if (cachedTweet) {
      return Response.json(cachedTweet, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch tweet from Twitter API
    const { data, tombstone, notFound } = await fetchTweet(tweetId);

    if (data) {
      // Cache the tweet
      await cacheTweet(tweetId, data);
      return Response.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'MISS',
        },
      });
    } else if (tombstone || notFound) {
      // Remove from cache if it was cached before (tombstone = deleted/made private)
      await removeCachedTweet(tweetId);
      return Response.json(
        { error: tombstone ? 'Tweet is unavailable' : 'Tweet not found' },
        { status: 404 },
      );
    }

    // Fallback: try getTweet as it might have better error handling
    const tweet = await getTweet(tweetId);
    if (tweet) {
      await cacheTweet(tweetId, tweet);
      return Response.json(tweet, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'MISS',
        },
      });
    }

    return Response.json({ error: 'Tweet not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    
    // Try to return cached version even if fetch failed
    const cachedTweet = await getCachedTweet(tweetId);
    if (cachedTweet) {
      return Response.json(cachedTweet, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'STALE',
        },
      });
    }

    return Response.json(
      { error: 'Failed to fetch tweet' },
      { status: 500 },
    );
  }
}

