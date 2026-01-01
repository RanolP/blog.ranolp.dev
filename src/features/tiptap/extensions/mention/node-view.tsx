import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Icon } from '@iconify/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import type { MentionItem } from './types';
import { twitterIconData, githubIconData, verifiedIconData } from './icons';

export function MentionNodeView({ node }: ReactNodeViewProps) {
  const attrs = node.attrs as MentionItem;
  const platform = attrs.id?.startsWith('tw:')
    ? 'twitter'
    : attrs.id?.startsWith('gh:')
    ? 'github'
    : null;

  const rawDisplayName =
    attrs.displayName || attrs.username || attrs.label || attrs.id;
  // Remove any existing @ prefix and add our own
  const displayName = rawDisplayName.replace(/^@+/, '');
  const username = attrs.username?.replace(/^@+/, '') || displayName;
  // Determine if we should show displayName separately
  const showDisplayName = attrs.displayName && attrs.displayName !== username;
  // For alt text, use the full format
  const displayNameWithAt = showDisplayName
    ? `${attrs.displayName} @${username}`
    : `@${username}`;

  // Generate URL based on platform
  const getMentionUrl = () => {
    if (!platform || !attrs.username) {
      return '#';
    }
    const username = attrs.username.replace(/^@+/, '');
    if (platform === 'twitter') {
      return `https://twitter.com/${username}`;
    } else if (platform === 'github') {
      return `https://github.com/${username}`;
    }
    return '#';
  };

  const [avatarError, setAvatarError] = React.useState(false);
  const showPlaceholder = !attrs.avatar || avatarError;

  return (
    <NodeViewWrapper
      as="span"
      className={`mention mention-${platform || 'default'}`}
      data-mention-id={attrs.id}
    >
      <a
        href={getMentionUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mention-link"
        onClick={(e) => {
          // Prevent editor from losing focus when clicking mention
          e.stopPropagation();
        }}
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
    </NodeViewWrapper>
  );
}
