'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Tweet } from 'react-tweet';

export function TwitterEmbedNode({ node }: NodeViewProps) {
  const url = node.attrs.url as string;
  const tweetIdRegex = /\/status\/(\d+)/g;
  const id = tweetIdRegex.exec(url)?.[1];

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

  return (
    <NodeViewWrapper className="twitter-embed">
      <Tweet id={id} />
    </NodeViewWrapper>
  );
}
