'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { MentionItem } from './types';
import { twitterIconData, githubIconData, verifiedIconData } from './icons';

export interface MentionSSRProps {
  attrs: MentionItem;
}

/**
 * Standalone React component for rendering mentions in SSR context
 * This is a simplified version of MentionNodeView without editor dependencies
 */
export function MentionSSR({ attrs }: MentionSSRProps) {
  const platform = attrs.id?.startsWith('tw:')
    ? 'twitter'
    : attrs.id?.startsWith('gh:')
      ? 'github'
      : null;

  const rawDisplayName =
    attrs.displayName || attrs.username || attrs.label || attrs.id;
  const displayName = rawDisplayName.replace(/^@+/, '');
  const username = attrs.username?.replace(/^@+/, '') || displayName;
  const showDisplayName = attrs.displayName && attrs.displayName !== username;
  const displayNameWithAt = showDisplayName
    ? `${attrs.displayName} @${username}`
    : `@${username}`;

  const getMentionUrl = () => {
    if (!platform || !attrs.username) {
      return '#';
    }
    const usernameClean = attrs.username.replace(/^@+/, '');
    if (platform === 'twitter') {
      return `https://twitter.com/${usernameClean}`;
    } else if (platform === 'github') {
      return `https://github.com/${usernameClean}`;
    }
    return '#';
  };

  const [avatarError, setAvatarError] = useState(false);
  const showPlaceholder = !attrs.avatar || avatarError;

  return (
    <span
      className={`mention mention-${platform || 'default'}`}
      data-mention-id={attrs.id}
      data-type="mention"
      data-id={attrs.id}
      data-label={attrs.label ?? attrs.id}
    >
      <a
        href={getMentionUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mention-link"
      >
        <span className="mention-content">
          {platform && (
            <span className={`mention-platform mention-platform-${platform}`}>
              {platform === 'twitter' ? (
                <Icon
                  icon={twitterIconData}
                  className="mention-platform-icon"
                  width={16}
                  height={16}
                />
              ) : platform === 'github' ? (
                <Icon
                  icon={githubIconData}
                  className="mention-platform-icon"
                  width={16}
                  height={16}
                />
              ) : null}
            </span>
          )}
          {attrs.avatar && !avatarError ? (
            <img
              className="mention-avatar"
              src={attrs.avatar}
              alt={displayNameWithAt}
              onError={() => {
                setAvatarError(true);
              }}
            />
          ) : null}
          {showPlaceholder && (
            <span className="mention-avatar mention-avatar-placeholder">
              {(displayName[0] || '@').toUpperCase()}
            </span>
          )}
          <span className="mention-text">
            {showDisplayName ? (
              <>
                <span className="mention-name">{attrs.displayName}</span>{' '}
                <span className="mention-handle">@{username}</span>
              </>
            ) : (
              <span className="mention-handle">@{username}</span>
            )}
            {attrs.verified && platform === 'twitter' && (
              <Icon
                icon={verifiedIconData}
                className="mention-verified"
                width={14}
                height={14}
              />
            )}
          </span>
        </span>
      </a>
    </span>
  );
}
