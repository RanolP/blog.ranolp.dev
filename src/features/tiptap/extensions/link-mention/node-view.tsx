'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import type { LinkMentionAttributes } from './index';

export function LinkMentionNodeView({ node }: NodeViewProps) {
  const attrs = node.attrs as LinkMentionAttributes;
  const { url, title, favicon, hostname } = attrs;

  const displayTitle = title || hostname || url;
  const [faviconError, setFaviconError] = React.useState(false);

  return (
    <NodeViewWrapper
      as="span"
      className="link-mention"
      data-url={url}
      data-title={title}
      data-favicon={favicon}
      data-hostname={hostname}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-mention-link"
        onClick={(e) => {
          // Prevent editor from losing focus when clicking link mention
          e.stopPropagation();
        }}
      >
        <span className="link-mention-content">
          {favicon && !faviconError ? (
            <img
              className="link-mention-favicon"
              src={favicon}
              alt=""
              onError={() => {
                setFaviconError(true);
              }}
            />
          ) : (
            <span className="link-mention-favicon link-mention-favicon-placeholder">
              {hostname?.[0]?.toUpperCase() || '🌐'}
            </span>
          )}
          <span className="link-mention-title">{displayTitle}</span>
        </span>
      </a>
    </NodeViewWrapper>
  );
}
