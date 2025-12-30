'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { Icon } from '@iconify/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import type { MentionItem } from './mention-menu';

export function MentionNode({ node }: ReactNodeViewProps) {
  const attrs = node.attrs as MentionItem;
  const platform = attrs.id?.startsWith('tw:')
    ? 'twitter'
    : attrs.id?.startsWith('gh:')
    ? 'github'
    : null;

  const displayName =
    attrs.displayName || attrs.username || attrs.label || attrs.id;

  return (
    <NodeViewWrapper
      as="span"
      className={`mention mention-${platform || 'default'}`}
      data-mention-id={attrs.id}
    >
      <span className="mention-content">
        {attrs.avatar ? (
          <img
            className="mention-avatar"
            src={attrs.avatar}
            alt={displayName}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextElementSibling as HTMLElement;
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <span
          className={`mention-avatar mention-avatar-placeholder ${
            attrs.avatar ? 'hidden' : ''
          }`}
        >
          {(attrs.displayName?.[0] || attrs.username?.[0] || '@').toUpperCase()}
        </span>
        <span className="mention-text">
          <span className="mention-name">{displayName}</span>
          {attrs.verified && platform === 'twitter' && (
            <Icon
              icon="mdi:check-circle"
              className="mention-verified"
              width={14}
              height={14}
            />
          )}
        </span>
        {platform && (
          <span className="mention-platform">
            {platform === 'twitter' ? (
              <Icon
                icon="mdi:twitter"
                className="mention-platform-icon"
                width={12}
                height={12}
              />
            ) : platform === 'github' ? (
              <Icon
                icon="mdi:github"
                className="mention-platform-icon"
                width={12}
                height={12}
              />
            ) : null}
          </span>
        )}
      </span>
    </NodeViewWrapper>
  );
}
