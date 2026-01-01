'use client';

import { EmbeddedTweet, TweetNotFound } from 'react-tweet';
import type { Tweet } from 'react-tweet/api';
import { useEffect, useState } from 'react';

interface TweetClientProps {
  tweetId: string;
}

export function TweetClient({ tweetId }: TweetClientProps) {
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTweet() {
      try {
        const response = await fetch(`/api/tweet?id=${tweetId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tweet');
        }
        const data = await response.json();
        setTweet(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchTweet();
  }, [tweetId]);

  if (loading) {
    return (
      <div className="twitter-embed">
        <div>Loading tweet...</div>
      </div>
    );
  }

  if (error || !tweet) {
    return (
      <div className="twitter-embed">
        <TweetNotFound error={error} />
      </div>
    );
  }

  return (
    <div className="twitter-embed">
      <EmbeddedTweet tweet={tweet} />
    </div>
  );
}
