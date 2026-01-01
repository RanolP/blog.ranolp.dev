'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { EmbeddedTweet, TweetNotFound } from 'react-tweet';
import type { Tweet } from 'react-tweet/api';
import { useEffect, useState } from 'react';

export function TwitterEmbedNodeView({ node }: NodeViewProps) {
  const url = node.attrs.url as string;
  const tweetIdRegex = /\/status\/(\d+)/g;
  const id = tweetIdRegex.exec(url)?.[1];
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchTweet() {
      try {
        const response = await fetch(`/api/tweet?id=${id}`);
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
