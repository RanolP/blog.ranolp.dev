'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { EmbeddedTweet, TweetNotFound } from 'react-tweet';
import type { Tweet } from 'react-tweet/api';
import { useEffect, useState, useMemo } from 'react';

export function TwitterEmbedNodeView({ node }: NodeViewProps) {
  const url = node.attrs.url as string;
  const id = useMemo(() => {
    if (!url) return undefined;
    const match = /\/status\/(\d+)/.exec(url);
    return match?.[1];
  }, [url]);

  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchTweet() {
      try {
        const response = await fetch(`/api/tweet?id=${id}`);
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
  }, [id]);

  if (!id) {
    return (
      <NodeViewWrapper as="div" className="twitter-embed twitter-embed-error">
        <p>Invalid tweet URL</p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View on Twitter
          </a>
        )}
      </NodeViewWrapper>
    );
  }

  if (loading) {
    return (
      <NodeViewWrapper className="twitter-embed">
        <div>Loading tweet...</div>
      </NodeViewWrapper>
    );
  }

  if (error || !tweet) {
    return (
      <NodeViewWrapper className="twitter-embed">
        <TweetNotFound error={error} />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="twitter-embed">
      <EmbeddedTweet tweet={tweet} />
    </NodeViewWrapper>
  );
}
