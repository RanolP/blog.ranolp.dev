import Mention from '@tiptap/extension-mention';
import type { MentionOptions } from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import { ReactRenderer, ReactNodeViewRenderer } from '@tiptap/react';
import { MentionNodeView } from './node-view';
import { MentionList } from './menu';
import { debouncedTwitterSearch, debouncedGitHubSearch } from './api';
import type { MentionItem } from './types';
import {
  twitterIconData,
  githubIconData,
  verifiedIconData,
  iconToSSR,
} from './icons';

// Re-export types
export type { MentionItem } from './types';
export { MentionList } from './menu';

/**
 * Custom suggestion items function for mentions
 * Supports Twitter (@tw:username) and GitHub (@gh:username) mentions
 *
 * Workflow:
 * 1. User types "@" - shows hint options: @tw: and @gh:
 * 2. User types "tw" or "gh" - shows the corresponding hint
 * 3. User types "tw:" or "gh:" - menu stays open, user continues typing
 * 4. User types "tw:username" - fetches Twitter users from API endpoint (throttled) and shows suggestions
 * 5. User types "gh:username" - shows GitHub mention (client-side for now)
 */
const getMentionSuggestionItems: MentionOptions['suggestion']['items'] =
  async ({ query }) => {
    const lowerQuery = query.toLowerCase();

    // Parse the query to detect prefix (tw: or gh:) with username
    const twitterMatch = query.match(/^tw:(.+)$/i);
    const githubMatch = query.match(/^gh:(.+)$/i);

    // If user has typed "tw:username", fetch from API endpoint (throttled)
    if (twitterMatch) {
      const username = twitterMatch[1].trim();
      if (username.length > 0) {
        try {
          console.log('Fetching Twitter user:', username);
          // Use debounced search to limit API calls
          const users = await debouncedTwitterSearch(username);
          console.log('Twitter users fetched:', users);
          // Return users with all their data (avatar, displayName, etc.)
          return users as MentionItem[];
        } catch (error) {
          console.error('Error fetching Twitter users:', error);
          // Fallback to showing the typed username as-is
          return [
            {
              id: `tw:${username}`,
              label: `@tw:${username}`,
              username: username,
            },
          ];
        }
      }
      // If just "tw:" without username, return empty to keep menu open
      return [];
    }

    // If user has typed "gh:username", fetch from API endpoint (debounced)
    if (githubMatch) {
      const username = githubMatch[1].trim();
      console.log(
        '[getMentionSuggestionItems] GitHub match found, username:',
        username,
      );
      if (username.length > 0) {
        try {
          console.log(
            '[getMentionSuggestionItems] Fetching GitHub user:',
            username,
          );
          // Use debounced search to limit API calls
          const users = await debouncedGitHubSearch(username);
          console.log(
            '[getMentionSuggestionItems] GitHub users fetched:',
            users,
          );
          // Return users with all their data (avatar, displayName, etc.)
          return users as MentionItem[];
        } catch (error) {
          console.error(
            '[getMentionSuggestionItems] Error fetching GitHub users:',
            error,
          );
          // Fallback to showing the typed username as-is
          return [
            {
              id: `gh:${username}`,
              label: `@gh:${username}`,
              username: username,
            },
          ];
        }
      }
      // If just "gh:" without username, return empty to keep menu open
      console.log('[getMentionSuggestionItems] GitHub match but no username');
      return [];
    }

    // If query is empty, show hint options (these will insert the prefix and keep typing)
    if (query.length === 0) {
      return [
        {
          id: 'tw:',
          label: '@tw:',
        },
        {
          id: 'gh:',
          label: '@gh:',
        },
      ];
    }

    // If user is typing "tw" or "t", show Twitter hint
    if (lowerQuery === 't' || lowerQuery.startsWith('tw')) {
      return [
        {
          id: 'tw:',
          label: '@tw:',
        },
      ];
    }

    // If user is typing "gh" or "g", show GitHub hint
    if (lowerQuery === 'g' || lowerQuery.startsWith('gh')) {
      return [
        {
          id: 'gh:',
          label: '@gh:',
        },
      ];
    }

    // Default: show both hint options
    return [
      {
        id: 'tw:',
        label: '@tw:',
      },
      {
        id: 'gh:',
        label: '@gh:',
      },
    ];
  };

/**
 * Mention extension for client-side editor with NodeView
 */
export const TiptapMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      username: {
        default: null,
      },
      displayName: {
        default: null,
      },
      avatar: {
        default: null,
      },
      verified: {
        default: false,
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView);
  },
}).configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: {
    char: '@',
    items: getMentionSuggestionItems,
    allowSpaces: false,
    render: () => {
      let component: ReactRenderer | null = null;

      return {
        onStart: (props: {
          items: MentionItem[];
          command: (item: MentionItem) => void;
          editor: any;
          range: { from: number; to: number };
          clientRect?: (() => DOMRect | null) | null;
        }) => {
          component = new ReactRenderer(MentionList, {
            props: {
              items: props.items,
              command: props.command,
              editor: props.editor,
            },
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          const element = component.element as HTMLElement;
          element.style.position = 'absolute';
          document.body.appendChild(element);
        },

        onUpdate: (props: {
          items: MentionItem[];
          command: (item: MentionItem) => void;
          editor: any;
          range: { from: number; to: number };
          clientRect?: (() => DOMRect | null) | null;
        }) => {
          component?.updateProps({
            items: props.items,
            command: props.command,
            editor: props.editor,
          });
        },

        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === 'Escape') {
            component?.destroy();
            return true;
          }

          const ref = component?.ref as
            | { onKeyDown: (props: { event: KeyboardEvent }) => boolean }
            | undefined;
          return ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          if (component) {
            const element = component.element as HTMLElement;
            element.remove();
            component.destroy();
            component = null;
          }
        },
      };
    },
    command: ({ editor, range, props }) => {
      console.log('Mention command called with props:', props);
      // If the id is just a prefix (ends with ':'), insert as text
      if (props.id && props.id.endsWith(':')) {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent(`@${props.id}`)
          .run();
      } else {
        // Otherwise, insert as mention node with all attributes
        const mentionItem = props as MentionItem;
        // Always include all available attributes
        const mentionAttrs: any = {
          id: mentionItem.id,
          label: mentionItem.label || mentionItem.id,
        };

        // Include optional fields if they exist
        if (mentionItem.username) {
          mentionAttrs.username = mentionItem.username;
        }
        if (mentionItem.displayName) {
          mentionAttrs.displayName = mentionItem.displayName;
        }
        if (mentionItem.avatar) {
          mentionAttrs.avatar = mentionItem.avatar;
        }
        if (mentionItem.verified !== undefined) {
          mentionAttrs.verified = mentionItem.verified;
        }

        console.log('Inserting mention with attrs:', mentionAttrs);

        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'mention',
            attrs: mentionAttrs,
          })
          .run();
      }
    },
  },
  renderLabel({ node }) {
    const attrs = node.attrs as MentionItem;
    // Format as: displayName @username (or just @username if no displayName or if displayName === username)
    const username =
      attrs.username?.replace(/^@+/, '') || attrs.id.replace(/^(tw|gh):/, '');
    if (attrs.displayName && attrs.displayName !== username) {
      return `${attrs.displayName} @${username}`;
    }
    return `@${username}`;
  },
});

/**
 * Create mention extension for SSR (without NodeView, so renderHTML is used)
 */
export function createMentionExtensionForSSR() {
  return Mention.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        username: {
          default: null,
        },
        displayName: {
          default: null,
        },
        avatar: {
          default: null,
        },
        verified: {
          default: false,
        },
      };
    },
    // IMPORTANT: override `renderHTML` on the extension itself (not via `.configure`)
    // so it is consistently used by `generateHTML()` on both server and client.
    renderHTML({ node, HTMLAttributes }) {
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
      const showDisplayName =
        attrs.displayName && attrs.displayName !== username;
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

      // For SSR, render the same structure as the React NodeView
      // This ensures consistent styling between posts/ and edit/ pages
      const content: any[] = ['span', { class: 'mention-content' }];

      // Platform icon first (using shared icon data for SSR/client consistency)
      if (platform) {
        const iconData =
          platform === 'twitter' ? twitterIconData : githubIconData;
        const iconSvg = iconToSSR(iconData, 'mention-platform-icon', 16, 16);

        content.push([
          'span',
          {
            class: `mention-platform mention-platform-${platform}`,
          },
          iconSvg,
        ]);
      }

      // Avatar or placeholder (matching React component behavior exactly)
      // React component shows avatar if exists and no error, otherwise shows placeholder
      // For SSR, we show avatar if it exists, placeholder otherwise (can't detect errors server-side)
      if (attrs.avatar) {
        content.push([
          'img',
          {
            class: 'mention-avatar',
            src: attrs.avatar,
            alt: displayNameWithAt,
          },
        ]);
      } else {
        // Only show placeholder if no avatar (matching React component's showPlaceholder logic)
        content.push([
          'span',
          {
            class: 'mention-avatar mention-avatar-placeholder',
          },
          (displayName[0] || '@').toUpperCase(),
        ]);
      }

      // Text content - split displayName and username for styling
      const textContent: any[] = ['span', { class: 'mention-text' }];
      if (showDisplayName) {
        textContent.push(
          ['span', { class: 'mention-name' }, attrs.displayName],
          ' ',
          ['span', { class: 'mention-handle' }, `@${username}`],
        );
      } else {
        textContent.push(['span', { class: 'mention-handle' }, `@${username}`]);
      }
      // Add verified icon for Twitter mentions (using shared icon data)
      if (attrs.verified && platform === 'twitter') {
        textContent.push(
          iconToSSR(verifiedIconData, 'mention-verified', 14, 14),
        );
      }
      content.push(textContent);

      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: `mention mention-${platform || 'default'}`,
          // keep legacy attribute (used by our CSS/hooks) and add TipTap mention attrs
          'data-mention-id': attrs.id,
          'data-type': 'mention',
          'data-id': attrs.id,
          'data-label': attrs.label ?? attrs.id,
        }),
        [
          'a',
          {
            href: getMentionUrl(),
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'mention-link',
          },
          content,
        ],
      ] as const;
    },
  }).configure({
    HTMLAttributes: {
      class: 'mention',
    },
  });
}
