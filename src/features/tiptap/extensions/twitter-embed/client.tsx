'use client';

import { EmbeddedTweet, TweetNotFound } from 'react-tweet';
import type { Tweet } from 'react-tweet/api';
import { useEffect, useState } from 'react';

interface TweetClientProps {
  tweetId: string;
  initialTweet?: Tweet | null;
}

export function TweetClient({ tweetId, initialTweet }: TweetClientProps) {
  const [tweet, setTweet] = useState<Tweet | null>(initialTweet ?? null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!initialTweet);

  useEffect(() => {
    // If we already have initial tweet data, skip fetching
    if (initialTweet) {
      setLoading(false);
      return;
    }

    if (!tweetId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchTweet() {
      try {
        const response = await fetch(`/api/tweet?id=${tweetId}`);
        if (cancelled) return;
        if (!response.ok) {
          throw new Error('Failed to fetch tweet');
        }
        const data = await response.json();
        if (cancelled) return;
        setTweet(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTweet();

    return () => {
      cancelled = true;
    };
  }, [tweetId, initialTweet]);

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
