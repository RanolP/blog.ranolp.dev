import Mention from '@tiptap/extension-mention';
import type { MentionOptions } from '@tiptap/extension-mention';
import { ReactRenderer, ReactNodeViewRenderer } from '@tiptap/react';
import { MentionNodeView } from './node-view';
import { MentionList } from './menu';
import { debouncedTwitterSearch, debouncedGitHubSearch } from './api';
import type { MentionItem } from './types';

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
    // No addNodeView for SSR - this ensures renderHTML is used
  }).configure({
    HTMLAttributes: {
      class: 'mention',
    },
    renderHTML({ node }) {
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

      // Platform icon first (render SVG icon for SSR)
      if (platform) {
        // Twitter icon SVG
        const twitterIconSvg = [
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '16',
            height: '16',
            viewBox: '0 0 24 24',
            fill: 'currentColor',
            class: 'mention-platform-icon',
          },
          [
            'path',
            {
              d: 'M22.46 6c-.77.35-1.6.58-2.46.69c.88-.53 1.56-1.37 1.88-2.38c-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29c0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15c0 1.49.75 2.81 1.91 3.56c-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.2 4.2 0 0 1-1.93.07a4.28 4.28 0 0 0 4 2.98a8.52 8.52 0 0 1-5.33 1.84q-.51 0-1.02-.06C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56c.84-.6 1.56-1.36 2.14-2.23',
            },
          ],
        ];

        // GitHub icon SVG
        const githubIconSvg = [
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '16',
            height: '16',
            viewBox: '0 0 24 24',
            fill: 'currentColor',
            class: 'mention-platform-icon',
          },
          [
            'path',
            {
              d: 'M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2',
            },
          ],
        ];

        const iconSvg = platform === 'twitter' ? twitterIconSvg : githubIconSvg;

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
      // Add verified icon for Twitter mentions (matching React component)
      if (attrs.verified && platform === 'twitter') {
        const verifiedIconSvg = [
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '14',
            height: '14',
            viewBox: '0 0 20 20',
            fill: 'currentColor',
            class: 'mention-verified',
          },
          [
            'path',
            {
              'fill-rule': 'evenodd',
              d: 'M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
              'clip-rule': 'evenodd',
            },
          ],
        ];
        textContent.push(verifiedIconSvg);
      }
      content.push(textContent);

      return [
        'span',
        {
          class: `mention mention-${platform || 'default'}`,
          'data-mention-id': attrs.id,
        },
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
  });
}
