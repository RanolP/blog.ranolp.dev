'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useMemo } from 'react';

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Match various YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function YouTubeEmbedNodeView({ node }: NodeViewProps) {
  const url = node.attrs.url as string;
  const videoId = useMemo(() => {
    if (!url) return null;
    return extractVideoId(url);
  }, [url]);

  if (!videoId) {
    return (
      <NodeViewWrapper as="div" className="youtube-embed youtube-embed-error">
        <p>Invalid YouTube URL</p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View on YouTube
          </a>
        )}
      </NodeViewWrapper>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <NodeViewWrapper className="youtube-embed">
      <div className="youtube-embed-container">
        <iframe
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="youtube-embed-iframe"
        />
      </div>
    </NodeViewWrapper>
  );
}

