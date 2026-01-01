'use client';

import { useState } from 'react';
import type { LinkMentionAttributes } from './index';

export interface LinkMentionSSRProps {
  attrs: LinkMentionAttributes;
}

/**
 * Standalone React component for rendering link mentions in SSR context
 */
export function LinkMentionSSR({ attrs }: LinkMentionSSRProps) {
  const { url, title, customTitle, favicon, hostname } = attrs;
  const displayTitle = customTitle || title || hostname || url;
  const [faviconError, setFaviconError] = useState(false);

  return (
    <span
      className="link-mention"
      data-type="link-mention"
      data-url={url}
      data-title={title}
      data-custom-title={customTitle}
      data-favicon={favicon}
      data-hostname={hostname}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-mention-link"
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
    </span>
  );
}
