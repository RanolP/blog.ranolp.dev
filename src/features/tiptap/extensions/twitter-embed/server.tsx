import { EmbeddedTweet, TweetNotFound } from 'react-tweet';
import { getCachedTweet } from '~/services/tweets/cache.server';
import { getTweet, fetchTweet } from 'react-tweet/api';

interface TweetServerProps {
  tweetId: string;
}

/**
 * Server component for rendering tweets with cached data
 * Fetches tweet data on the server and uses EmbeddedTweet to render
 */
export async function TweetServer({ tweetId }: TweetServerProps) {
  try {
    // Check cache first
    let tweet = await getCachedTweet(tweetId);

    if (!tweet) {
      // Fetch from Twitter API
      const { data, tombstone, notFound } = await fetchTweet(tweetId);

      if (data) {
        tweet = data;
        // Cache will be handled by the API endpoint when called from client
        // For server-side rendering, we can cache it here too
        const { cacheTweet } = await import('~/services/tweets/cache.server');
        await cacheTweet(tweetId, data);
      } else if (tombstone || notFound) {
        return <TweetNotFound />;
      } else {
        // Fallback: try getTweet
        tweet = await getTweet(tweetId);
        if (tweet) {
          const { cacheTweet } = await import('~/services/tweets/cache.server');
          await cacheTweet(tweetId, tweet);
        }
      }
    }

    if (!tweet) {
      return (
        <div className="twitter-embed">
          <TweetNotFound />
        </div>
      );
    }

    return (
      <div className="twitter-embed">
        <EmbeddedTweet tweet={tweet} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching tweet:', error);
    return <TweetNotFound error={error instanceof Error ? error : undefined} />;
  }
}

